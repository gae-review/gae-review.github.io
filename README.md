# GAE — Anonymous Supplementary Material

A self-contained static supplementary website for an anonymous submission. No build step, external CDN, analytics, or parent-directory assets are required.

## 本地预览

在本目录打开终端：

```bash
python3 scripts/preview.py
```

打开 http://127.0.0.1:8767 。预览服务器支持视频拖动所需的 HTTP Range。请通过服务器预览，避免直接双击 HTML 导致浏览器限制。

## 上传到 GitHub Pages

1. 使用不暴露作者或单位的 GitHub 账号，新建一个**空的、独立的公开仓库**，例如 `anonymous-supplement`。不要 fork 实名仓库，也不要复制旧仓库的 `.git` 历史。账号头像、个人资料、仓库描述均不应包含身份信息。
2. 将**本目录中的内容**放在仓库根目录；`index.html`、`assets/`、`.nojekyll` 应直接位于根目录。不要把 ZIP 文件本身上传作为网页。
3. 推荐 Git 上传。下面的账号占位符替换为匿名账号；这些身份设置只作用于这个新仓库。在第一次提交前设置：

```bash
git init -b main
git config --local user.name "Anonymous Authors"
git config --local user.email "anonymous@example.invalid"
git config --local commit.gpgsign false
git config --local tag.gpgsign false
git add .
git commit -m "Add anonymous supplementary website"
git remote add origin https://github.com/ANONYMOUS_ACCOUNT/anonymous-supplement.git
git push -u origin main
```

4. 在仓库 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch**，分支 `main`，目录 `/ (root)`，然后 Save。
5. 发布后访问 `https://ANONYMOUS_ACCOUNT.github.io/anonymous-supplement/`，确认视频、场景切换和 3D 查看正常，再将网址用于提交。

站点约 871 MiB，最大单文件约 18.5 MiB；资源较多，建议使用 Git，避免浏览器逐批上传时遗漏文件。不要启用 Git LFS 作为 Pages 资源交付方式。`.nojekyll` 需要一起提交。相对资源路径支持仓库子路径部署。

## 匿名版包含的内容

- 保留 GAE 方法介绍、方法图、实验比较、RGB/深度视频、相机轨迹、交互式点云和场景切换。
- 作者区替换为 Anonymous Authors；保留论文题目和方法名称。
- 去掉作者主页、单位、arXiv、实名代码仓库及公开论文 PDF 的入口和文件。
- 不附带公开宣传视频、原始轨迹归档、服务器来源说明、备份或旧 Git 历史。
- 中性化部分资源目录和含人名的场景路径；资源使用独立副本。
- 添加 `noindex`、`robots.txt` 和 `no-referrer`，未添加访客统计。这些设置不等于访问控制，也不能保证搜索引擎完全不收录。

主文请以投稿系统中的匿名稿件为准。如需在此补充 PDF 或介绍视频，先确认正文、致谢、画面、声音和文件元数据中均无身份信息，再添加。

本地检查覆盖页面身份字段、文本资源、媒体元数据和主要交互；它不能保证托管账号、部署后配置或每一帧画面都满足匿名要求。发布前请复看展示内容，并在截止后按会议规则管理修改。

ICLR 的演示链接需完全匿名，且不能追踪访客。请参照 [ICLR 2027 Author Guidelines](https://iclr.cc/Conferences/2027/AuthorGuidelines) 中的 demonstration-link 条目。站点容量规则见 [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。
