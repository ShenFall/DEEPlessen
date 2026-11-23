import { ensureDir, listPublishManifests } from '../fs'

type DirHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

async function writeText(
  dir: FileSystemDirectoryHandle,
  name: string,
  text: string,
) {
  const file = await dir.getFileHandle(name, { create: true })
  const w = await file.createWritable()
  await w.write(text)
  await w.close()
}

const PORTAL_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="color-scheme" content="light" />
<meta name="theme-color" content="#f7f4ee" />
<title>课程资料</title>
<style>
:root{--bg:#f7f4ee;--card:#fff;--line:#e6e0d5;--ink:#1a1f2a;--dim:#616875;--gold:#8c5a20;--chip:#f0ebe1;--r-card:12px;--r-input:10px;--r-chip:9px}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{background:var(--bg)}
body{margin:0;color:var(--ink);background:radial-gradient(120% 55% at 82% -8%,rgba(140,90,32,.045),transparent 58%),var(--bg);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.wrap{position:relative;z-index:1;max-width:600px;margin:0 auto;padding:28px 16px 56px;overflow:hidden}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.6;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1.5' cy='1.5' r='1' fill='%238c5a20' fill-opacity='0.13'/%3E%3C/svg%3E");
  background-size:24px 24px}
.orbit{position:absolute;top:-70px;right:-60px;width:260px;height:260px;pointer-events:none;opacity:.5}
.orbit--bl{top:auto;right:auto;bottom:-96px;left:-84px;width:300px;height:300px;opacity:.32;transform:rotate(160deg)}
.rings{stroke:var(--line)}.stars{fill:var(--gold)}
h1{position:relative;margin:0;font-size:24px;font-weight:600;letter-spacing:-.02em}
.meta{position:relative;margin:6px 0 0;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums}
.search{position:sticky;top:0;z-index:5;padding:12px 0 10px;background:linear-gradient(var(--bg) 76%,transparent)}
input{display:block;width:100%;height:44px;padding:0 14px;border:1px solid var(--line);border-radius:var(--r-input);background:var(--card);font:inherit;font-size:14px;color:var(--ink);appearance:none}
input::placeholder{color:var(--dim)}
input:focus{outline:none;border-color:#cdbfa4;box-shadow:0 0 0 3px rgba(140,90,32,.08)}
input:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.g{margin:20px 0 0;animation:up .2s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*24ms)}
.g.s{animation:none}
.g:nth-of-type(n+9){animation:none}
.g h2{display:flex;align-items:baseline;gap:8px;margin:0 0 8px;font-size:14px;font-weight:600}
.g h2 .c{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.g h2 .k{margin-left:auto;flex:none;font-size:12px;font-weight:400;color:var(--dim);font-variant-numeric:tabular-nums}
ul{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);overflow:hidden}
li+li{border-top:1px solid var(--line)}
a{display:flex;align-items:center;gap:12px;min-height:62px;padding:11px 14px;text-decoration:none;color:inherit;transition:background .12s ease}
a:active{background:#f3eee4}
a:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.ext{flex:none;width:38px;height:38px;border-radius:var(--r-chip);background:var(--chip);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--gold)}
.n{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.n b{font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.n i{font-style:normal;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.dl{flex:none;font-size:12px;color:var(--gold)}
.empty{color:var(--dim);font-size:13px;text-align:center;padding:36px 0;margin:0}
footer{margin-top:28px;text-align:center;font-size:12px;color:var(--dim)}
@keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(hover:hover){a:hover{background:#faf7f1}}
@media(prefers-reduced-motion:reduce){.g{animation:none}}
</style>
</head>
<body>
<div class="wrap">
  <svg class="orbit" viewBox="0 0 260 260" fill="none" aria-hidden="true">
    <g class="rings" stroke-width="1">
      <circle cx="130" cy="130" r="118" stroke-dasharray="2 6"/>
      <circle cx="130" cy="130" r="86" stroke-dasharray="1 7"/>
      <circle cx="130" cy="130" r="54"/>
    </g>
    <g class="stars">
      <circle cx="130" cy="16" r="2.5"/>
      <circle cx="212" cy="176" r="1.8"/>
      <circle cx="70" cy="205" r="1.4"/>
    </g>
  </svg>
  <svg class="orbit orbit--bl" viewBox="0 0 260 260" fill="none" aria-hidden="true">
    <g class="rings" stroke-width="1">
      <circle cx="130" cy="130" r="120" stroke-dasharray="1 8"/>
      <circle cx="130" cy="130" r="78" stroke-dasharray="2 5"/>
      <circle cx="130" cy="130" r="40"/>
    </g>
    <g class="stars">
      <circle cx="130" cy="10" r="1.6"/>
      <circle cx="52" cy="176" r="1.2"/>
    </g>
  </svg>
  <h1>课程资料</h1>
  <p class="meta" id="meta" aria-live="polite">加载中…</p>
  <div class="search"><input id="q" aria-label="搜索文件名或课程" placeholder="搜索文件名或课程" /></div>
  <div id="list" aria-live="polite"></div>
  <footer id="foot"></footer>
</div>
<script>
(function(){
  var data=null,total=0;
  function size(n){ if(n<1024) return n+' B'; if(n<1048576) return (n/1024).toFixed(1)+' KB'; return (n/1048576).toFixed(1)+' MB'; }
  function ext(n){ var i=n.lastIndexOf('.'); return i<0 ? 'FILE' : n.slice(i+1).toUpperCase().slice(0,4); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
  function render(q,animate){
    var box=document.getElementById('list');
    if(!data){ box.innerHTML=''; return; }
    var key=(q||'').trim().toLowerCase(),html='',n=0;
    data.courses.forEach(function(c){
      var items=c.items.filter(function(i){
        return !key || i.name.toLowerCase().indexOf(key)>=0 || c.name.toLowerCase().indexOf(key)>=0;
      });
      if(!items.length) return;
      var i=Math.min(n,7),cls=animate?'g':'g s';
      html+='<section class="'+cls+'" style="--i:'+i+'"><h2><span class="c">'+esc(c.name)+'</span><span class="k">'+items.length+' 个文件</span></h2><ul>';
      items.forEach(function(f){
        html+='<li><a href="'+esc(f.url)+'" download="'+esc(f.name)+'" aria-label="下载 '+esc(f.name)+'">'
          +'<span class="ext">'+esc(ext(f.name))+'</span>'
          +'<span class="n"><b>'+esc(f.name)+'</b><i>'+size(f.size)+'</i></span>'
          +'<span class="dl">下载</span></a></li>';
      });
      html+='</ul></section>';n+=1;
    });
    box.innerHTML=html || (total ? '<p class="empty">没有匹配的资料</p>' : '<p class="empty">还没有资料</p>');
  }
  fetch('manifest.json').then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){
    data=d;data.courses=Array.isArray(d.courses)?d.courses:[];
    total=data.courses.reduce(function(a,c){ return a+c.items.length; },0);
    document.getElementById('meta').textContent=total+' 个文件 · '+data.courses.length+' 门课';
    var dt=new Date(d.generatedAt);
    document.getElementById('foot').textContent=isNaN(dt.getTime())?'点击文件名直接下载':'更新于 '+(dt.getMonth()+1)+' 月 '+dt.getDate()+' 日';
    render('',true);
  }).catch(function(){
    data=null;total=0;
    document.getElementById('meta').textContent='清单读不出来，请刷新页面';
    document.getElementById('list').innerHTML='';
    document.getElementById('foot').textContent='';
  });
  document.getElementById('q').addEventListener('input',function(e){ render(e.target.value,false); });
})();
</script>
</body>
</html>`

export type PortalResult = {
  files: number
  courses: number
  /** 超过单文件上限、没打进包的文件 */
  skipped: { course: string; name: string; size: number }[]
}

/** EdgeOne Pages 单文件 25MB */
const MAX_FILE = 25 * 1024 * 1024

/**
 * 把已发布的资料打成一个可上传的静态站：
 * portal/index.html + portal/manifest.json + portal/files/<slug>/…
 * 之后把 portal 整个目录拖到任意静态托管即可。
 */
export async function exportPortal(
  root: FileSystemDirectoryHandle,
): Promise<PortalResult> {
  const manifests = await listPublishManifests(root)
  const portal = await ensureDir(root, 'portal')
  const filesDir = (await portal.getDirectoryHandle('files', {
    create: true,
  })) as DirHandle
  const publishDir = (await root.getDirectoryHandle('publish')) as DirHandle

  const courses = new Map<string, { name: string; size: number; url: string }[]>()
  const skipped: { course: string; name: string; size: number }[] = []
  const seen = new Set<string>()
  let count = 0

  for (const m of manifests) {
    const slugDir = (await publishDir.getDirectoryHandle(m.slug)) as DirHandle
    const srcFiles = (await slugDir.getDirectoryHandle('files')) as DirHandle
    const dest = (await filesDir.getDirectoryHandle(m.slug, {
      create: true,
    })) as DirHandle

    for (const item of m.items) {
      // 同一课程重复发布会产生同名文件，只保留最新那次（manifests 已按时间倒序）
      const key = `${m.course}::${item.name}`
      if (seen.has(key)) continue
      seen.add(key)

      if (item.size > MAX_FILE) {
        skipped.push({ course: m.course, name: item.name, size: item.size })
        continue
      }
      try {
        const src = await srcFiles.getFileHandle(item.name)
        const data = await src.getFile()
        const target = await dest.getFileHandle(item.name, { create: true })
        const w = await target.createWritable()
        await w.write(data)
        await w.close()

        const list = courses.get(m.course) ?? []
        list.push({
          name: item.name,
          size: item.size,
          url: `files/${encodeURIComponent(m.slug)}/${encodeURIComponent(item.name)}`,
        })
        courses.set(m.course, list)
        count += 1
      } catch {
        // 单个文件缺失不影响整体导出
      }
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    courses: [...courses.entries()].map(([name, items]) => ({ name, items })),
  }

  await writeText(portal, 'manifest.json', JSON.stringify(manifest, null, 2))
  await writeText(portal, 'index.html', PORTAL_HTML)

  if (skipped.length > 0) {
    const rows = skipped
      .map((s) => `| ${s.course} | ${s.name} | ${(s.size / 1048576).toFixed(1)} MB |  |`)
      .join('\n')
    await writeText(
      portal,
      'large-files.md',
      `# 未打进包的文件\n\n` +
        `EdgeOne Pages 单文件上限 25MB。下面这些文件没有复制到 portal/files，\n` +
        `门户里也不会出现。请把它们传到别处（Gitee / GitHub Release、网盘），\n` +
        `把链接填进最后一列，然后手工加到 manifest.json 对应课程里，再重新部署。\n\n` +
        `| 课程 | 文件 | 大小 | 外链 |\n|---|---|---|---|\n${rows}\n`,
    )
  }

  return { files: count, courses: courses.size, skipped }
}
