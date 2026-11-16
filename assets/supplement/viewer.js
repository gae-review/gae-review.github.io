(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const order = ['omniworld_09','omniworld_04','omniworld_13','omniworld_36','omni_09','omniworld_35','omni_10'];
  const byKey = new Map((window.NGD_DYNAMIC_SAMPLES || []).map(s => [s.key,s]));
  const scenes = order.filter(k => byKey.has(k)).map(k => byKey.get(k));
  const comparisonOrder=['026_3e60af81a408_split5','omni_10','omni_09','omniworld_36','omniworld_13'];
  const comparisons = [...(window.NGD_COMPARISON_SAMPLES || [])].sort((a,b)=>comparisonOrder.indexOf(a.key)-comparisonOrder.indexOf(b.key));
  const types = {omniworld_36:'Walking character',omni_09:'Horse and rider',omniworld_35:'Moving vehicle',omniworld_04:'Horse and rider',omniworld_09:'Walking character',omni_10:'Moving vehicle',omniworld_13:'Horse and rider'};
  document.querySelector('#dynamic-count').textContent = `${scenes.length} video examples`;
  document.querySelector('#comparison-count').textContent = `${comparisons.length} paired comparisons`;
  const tabs = document.querySelector('#scene-tabs');
  const viewer = document.querySelector('#scene-viewer');
  let active = '', cleanup = () => {};
  for (const s of scenes) {
    const tab = document.createElement('button');
    tab.className = 'scene-tab';tab.id = `tab-${s.key}`;tab.dataset.key = s.key;
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls','scene-viewer');
    tab.innerHTML = `<img src="${esc(s.rgbPoster)}" alt="" loading="lazy"><span class="tab-title">${esc(s.title)}</span><span class="tab-kind">${esc(types[s.key])}</span>`;
    tab.onclick = () => showScene(s.key,true);
    tab.onkeydown = event => {
      const index=scenes.findIndex(x=>x.key===s.key);
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%scenes.length;
      else if(event.key==='ArrowLeft')next=(index+scenes.length-1)%scenes.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=scenes.length-1;
      else return;
      event.preventDefault();showScene(scenes[next].key,true);document.querySelector(`#tab-${scenes[next].key}`).focus();
    };
    tabs.append(tab);
  }

  function showScene(key, updateHash=false) {
    const s=byKey.get(key);if(!s || !order.includes(key))return;
    cleanup();active=key;
    for(const tab of tabs.children){const selected=tab.dataset.key===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
    viewer.setAttribute('aria-labelledby',`tab-${key}`);
    if(updateHash)history.replaceState(null,'',`#${key}`);
    const hasComparison=comparisons.some(x=>x.key===key);
    viewer.innerHTML=`<article class="viewer" id="${esc(key)}">
      <div class="viewer-head"><div><h3>${esc(s.title)}</h3><p class="viewer-subtitle">${esc(types[key])} · GAE-64 final model</p></div><div class="scene-arrows"><button class="previous" aria-label="Previous scene">←</button><button class="next" aria-label="Next scene">→</button></div></div>
      <div class="pair"><figure><figcaption><span class="mode-label">Generated RGB</span><span class="toggle" role="group" aria-label="Image view"><button data-mode="rgb" aria-pressed="true">RGB</button><button data-mode="depth" aria-pressed="false">Depth</button></span></figcaption><video data-summary-output class="left" muted playsinline preload="metadata" src="${esc(s.rgb)}" poster="${esc(s.rgbPoster)}" aria-label="Generated RGB video"></video></figure>
      <figure><figcaption class="geometry-label"><span>Progressive 3D geometry</span><small><i class="blue-dot"></i>Current-frame points</small></figcaption><video data-summary-output class="right" muted playsinline preload="metadata" src="${esc(s.progressive)}" poster="${esc(s.progressivePoster)}" aria-label="Progressive geometry video"></video></figure></div>
      <div class="controls"><button class="play">Play both</button><input class="seek" type="range" min="0" max="${s.frameCount-1}" value="0" step="1" aria-label="Video frame"><span class="frame">01 / ${s.frameCount}</span><label>Speed <select class="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option></select></label></div>
      <p class="playback-note">RGB / depth and geometry are synchronized by frame. Pause or drag the slider to inspect the moving foreground.</p><p class="error" role="status" hidden></p>
      <div class="links">${hasComparison?`<a href="#comparison-${esc(key)}">SD-VAE / GAE-64 comparison ↓</a>`:''}<a href="${esc(s.rgb)}">RGB video ↗</a><a href="${esc(s.depth)}">Depth video ↗</a><a href="${esc(s.progressive)}">Geometry video ↗</a><a href="#${esc(key)}">Link to this scene</a></div>
      <details class="conditions"><summary>Reference image and text condition</summary><div class="condition-body"><a href="${esc(s.reference)}" aria-label="Open reference image"><img src="${esc(s.reference)}" alt="Input reference frame" loading="lazy"></a><p>${esc(s.caption)}</p></div></details>
    </article>`;
    const a=viewer.querySelector('.left'), b=viewer.querySelector('.right'), play=viewer.querySelector('.play'), seek=viewer.querySelector('.seek'), label=viewer.querySelector('.frame'), speed=viewer.querySelector('.speed'), error=viewer.querySelector('.error');
    const visibilityObserver=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0.05});
    visibilityObserver.observe(viewer);
    const abort=new AbortController();const listen=(target,name,fn)=>target.addEventListener(name,fn,{signal:abort.signal});
    let raf=0,disposed=false,pendingFrame=0;
    const valid=v=>Number.isFinite(v.duration)&&v.duration>0;
    const frame=()=>valid(a)?Math.min(s.frameCount-1,Math.floor(a.currentTime/a.duration*s.frameCount+1e-5)):pendingFrame;
    const sync=(force=false)=>{
      if(valid(a)&&valid(b)){
        a.playbackRate=Number(speed.value);b.playbackRate=b.duration/a.duration*a.playbackRate;
        const target=Math.min(a.currentTime/a.duration*b.duration,b.duration-.001);
        if(force||Math.abs(b.currentTime-target)>.07)b.currentTime=target;
      }
      const f=frame();seek.value=f;label.textContent=String(f+1).padStart(2,'0')+' / '+s.frameCount;
    };
    const pause=()=>{a.pause();b.pause();cancelAnimationFrame(raf);play.textContent='Play both';};
    const tick=()=>{sync();if(!disposed&&!a.paused)raf=requestAnimationFrame(tick);};
    const setFrame=f=>{pendingFrame=f;if(valid(a))a.currentTime=f/s.frameCount*a.duration;if(valid(b))b.currentTime=f/s.frameCount*b.duration;sync(true);};
    const start=async()=>{
      try{error.hidden=true;await a.play();if(disposed)return;sync(true);await b.play();if(disposed)return;play.textContent='Pause';cancelAnimationFrame(raf);tick();}
      catch(e){if(disposed)return;pause();error.textContent='Video could not be played. Please retry, or open the direct video link.';error.hidden=false;}
    };
    play.onclick=()=>{if(a.paused){if(a.ended||frame()>=s.frameCount-1)setFrame(0);start();}else pause();};
    seek.oninput=()=>setFrame(Number(seek.value));speed.onchange=()=>sync(true);
    listen(a,'loadedmetadata',()=>setFrame(pendingFrame));listen(b,'loadedmetadata',()=>sync(true));
    listen(a,'seeked',()=>sync(true));listen(a,'timeupdate',()=>sync());listen(a,'ended',pause);
    listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
    for(const video of [a,b])listen(video,'error',()=>{pause();error.textContent='A video could not be loaded. Please try its direct link below.';error.hidden=false;});
    viewer.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
      const f=frame(),resume=!a.paused;pause();pendingFrame=f;
      const mode=button.dataset.mode;a.src=s[mode];a.poster=s[mode+'Poster'];
      const title=mode==='rgb'?'Generated RGB':'Decoded depth';viewer.querySelector('.mode-label').textContent=title;a.setAttribute('aria-label',title+' video');
      viewer.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
      if(resume)a.addEventListener('loadedmetadata',()=>{if(!disposed)start();},{once:true,signal:abort.signal});a.load();
    });
    const index=scenes.findIndex(x=>x.key===key);
    viewer.querySelector('.previous').onclick=()=>showScene(scenes[(index+scenes.length-1)%scenes.length].key,true);
    viewer.querySelector('.next').onclick=()=>showScene(scenes[(index+1)%scenes.length].key,true);
    cleanup=()=>{disposed=true;pause();abort.abort();visibilityObserver.disconnect();};
  }

  const nav=document.querySelector('#comparison-nav'), list=document.querySelector('#comparison-cases');
  for(const [index,s] of comparisons.entries()){
    const id=`comparison-${s.key}`;const link=document.createElement('a');link.href='#'+id;link.textContent=s.title;nav.append(link);
    const card=document.createElement('article');card.className='comparison-card';card.id=id;
    const heldOut=s.evaluationRole.includes('held-out');
    card.innerHTML=`<div class="comparison-head"><h3>${String(index+1).padStart(2,'0')} · ${esc(s.title)}</h3><span class="split-label">${heldOut?'Held-out clip':'Training-source clip'}</span></div><p class="comparison-caption">Left: GT &nbsp; · &nbsp; Middle: SD-VAE &nbsp; · &nbsp; Right: GAE-64</p><video data-summary-output class="comparison-video" src="${esc(s.video)}" poster="${esc(s.poster)}" controls muted playsinline loop preload="metadata" aria-label="${esc(s.title)}: GT, SD-VAE and GAE-64 comparison"></video><div class="links"><a href="${esc(s.video)}">Open comparison video ↗</a>${byKey.has(s.key)?`<a class="back-to-scene" href="#${esc(s.key)}">Final-model RGB &amp; geometry ↑</a>`:''}<a href="#${esc(id)}">Link to this comparison</a></div>`;
    list.append(card);
    card.querySelector('video').addEventListener('play',()=>{
      for(const other of document.querySelectorAll('.comparison-video'))if(other!==card.querySelector('video'))other.pause();
    });
  }
  const openHash=()=>{const key=decodeURIComponent(location.hash.slice(1));if(byKey.has(key)&&order.includes(key)){showScene(key);viewer.scrollIntoView({block:'start'});}};
  window.addEventListener('hashchange',openHash);
  showScene(scenes[0].key);
  if(location.hash)requestAnimationFrame(()=>{
    if(byKey.has(location.hash.slice(1)))openHash();
    else document.getElementById(location.hash.slice(1))?.scrollIntoView();
  });
})();
