(() => {
 'use strict';
 const root=document.querySelector('#revisit'), samples=window.GAE_REVISIT_SAMPLES;
 if(!root||!samples?.length)return;
 const q=s=>root.querySelector(s), videos=[q('#rv-gae'),q('#rv-sd')], tabs=q('#rv-tabs'), slider=q('#rv-seek'), play=q('#rv-play');
 let index=0, mode='rgb', pending=0, loaded=false, epoch=0, raf=0, visible=false, intent=true, starting=false, attempt=0;
 const timings={rgb:{journey:81/12,total:123/12},pointcloud:{journey:81/16,total:145/16}};
 const phase=(t,m)=>{const x=timings[m];return t<x.journey?t/x.journey:1+(t-x.journey)/(x.total-x.journey)};
 const fromPhase=(p,m)=>{const x=timings[m];return p<1?p*x.journey:x.journey+(p-1)*(x.total-x.journey)};
 const time=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
 function update(){const a=videos[0],total=timings[mode].total,t=a.readyState?a.currentTime:pending;slider.value=t/total*1000;q('#rv-time').textContent=`${time(t)} / ${time(total)}`;}
 function pause(){attempt++;starting=false;videos.forEach(v=>v.pause());cancelAnimationFrame(raf);play.innerHTML='Play both <span aria-hidden="true">▶</span>';play.setAttribute('aria-label','Play both revisit videos');}
 function tick(){const [a,b]=videos;if(a.readyState>=2&&b.readyState>=2&&Math.abs(a.currentTime-b.currentTime)>.06)b.currentTime=a.currentTime;update();if(!a.paused)raf=requestAnimationFrame(tick);}
 function seek(t){pending=t;videos.forEach(v=>{if(v.readyState)v.currentTime=Math.min(t,v.duration-.01)});update();}
 async function start(){if(starting)return;const id=++attempt;starting=true;try{q('#rv-error').hidden=true;await Promise.all(videos.map(v=>v.play()));if(id!==attempt)return;play.innerHTML='Pause <span aria-hidden="true">Ⅱ</span>';play.setAttribute('aria-label','Pause both revisit videos');cancelAnimationFrame(raf);tick();}catch(e){if(id!==attempt)return;pause();if(e.name!=='NotAllowedError'&&e.name!=='AbortError')q('#rv-error').hidden=false;}finally{if(id===attempt)starting=false;}}
 function autoStart(){if(visible&&!document.hidden&&intent&&videos.every(v=>v.readyState>=2)&&videos.some(v=>v.paused))start();}

 function renderLegends(){
  for(const m of ['gae','sd']){
   const host=q(`#rv-${m}-legend`);
   host.hidden=mode==='rgb';
   host.innerHTML=mode==='pointcloud'?'<span class="rv-legend"><i></i>Frame 0</span><span class="rv-legend"><i></i>Frame 80</span>':'';
  }
 }
 function render(t=0){
  epoch++;pause();pending=t;const s=samples[index];q('#rv-title').textContent=s.title;q('#rv-route').textContent=s.trajectory;q('#rv-count').textContent=`${String(index+1).padStart(2,'0')} / ${samples.length}`;
  [...tabs.children].forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});q('#rv-panel').setAttribute('aria-labelledby',`rv-tab-${index}`);
  for(const [i,m] of ['gae','sd'].entries()){
   const asset=s.media[m][mode],v=videos[i];v.poster=asset.poster;v.src=asset.video;v.preload=loaded?'auto':'none';v.loop=true;q(`#rv-open-${m}`).href=asset.video;if(loaded)v.load();
  }
  q('#rv-error').hidden=true;q('#rv-caption').textContent=mode==='rgb'?'The closing panels compare the input frame with the final generated frame.':'The closing view overlays frame 0 (cyan) and frame 80 (orange).';
  renderLegends();update();
 }
 function select(i){intent=true;index=(i+samples.length)%samples.length;render();const tab=tabs.children[index],left=tab.offsetLeft-tabs.offsetLeft;if(left<tabs.scrollLeft||left+tab.offsetWidth>tabs.scrollLeft+tabs.clientWidth)tabs.scrollTo({left:Math.max(0,left-tabs.clientWidth/2+tab.offsetWidth/2),behavior:'smooth'});}
 samples.forEach((s,i)=>{const tab=document.createElement('button');tab.className='rv-tab';tab.id=`rv-tab-${i}`;tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-controls','rv-panel');const img=document.createElement('img');img.src=s.thumbnail;img.alt='';img.loading='lazy';const title=document.createElement('strong');title.textContent=s.title;const route=document.createElement('small');route.textContent=s.trajectory;tab.append(img,title,route);tab.onclick=()=>select(i);tab.onkeydown=e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%samples.length;else if(e.key==='ArrowLeft')next=(i+samples.length-1)%samples.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=samples.length-1;else return;e.preventDefault();select(next);tabs.children[next].focus({preventScroll:true})};tabs.append(tab)});
 videos.forEach(v=>{v.addEventListener('loadedmetadata',()=>{v.currentTime=Math.min(pending,v.duration-.01);update()});v.addEventListener('canplay',autoStart);v.addEventListener('error',()=>{pause();q('#rv-error').hidden=false;});});
 videos[0].addEventListener('timeupdate',update);
 play.onclick=()=>{if(!videos[0].paused||starting){intent=false;pause();return;}intent=true;loaded=true;start();};
 slider.oninput=()=>{intent=false;pause();seek(Number(slider.value)/1000*timings[mode].total)};
 q('#rv-return').onclick=()=>{intent=false;loaded=true;pause();videos.forEach(v=>{v.preload='auto'});seek(timings[mode].journey+.2)};
 q('#rv-prev').onclick=()=>select(index-1);q('#rv-next').onclick=()=>select(index+1);
 root.querySelectorAll('[data-rv-mode]').forEach(button=>button.onclick=()=>{if(mode===button.dataset.rvMode)return;const p=phase(videos[0].readyState?videos[0].currentTime:pending,mode);mode=button.dataset.rvMode;root.querySelectorAll('[data-rv-mode]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});render(fromPhase(p,mode));});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else autoStart()});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(!loaded){loaded=true;videos.forEach(v=>{v.preload='auto';v.load()})}autoStart()}else pause()},{threshold:.05}).observe(q('.rv-stage'));
 render();
})();
