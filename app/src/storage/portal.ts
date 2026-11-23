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
:root{--bg:#f7f4ee;--card:#fff;--line:#e6e0d5;--ink:#1a1f2a;--dim:#616875;--gold:#8c5a20;--chip:#f0ebe1;--ease:cubic-bezier(.2,.8,.2,1)}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{background:var(--bg)}
body{margin:0;min-height:100dvh;color:var(--ink);
  background:radial-gradient(120% 50% at 82% -6%,rgba(140,90,32,.05),transparent 60%),var(--bg);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;
  background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27%3E%3Cg fill=%27none%27 stroke=%27%23c9b894%27 stroke-width=%271%27%3E%3Ccircle cx=%27150%27 cy=%27150%27 r=%27112%27 stroke-dasharray=%272 9%27 opacity=%27.45%27/%3E%3Ccircle cx=%27150%27 cy=%27150%27 r=%2774%27 opacity=%27.5%27/%3E%3Ccircle cx=%27150%27 cy=%27150%27 r=%2738%27 opacity=%27.35%27/%3E%3C/g%3E%3Cg fill=%27%23c9a05c%27 opacity=%27.45%27%3E%3Ccircle cx=%27242.0%27 cy=%27150.0%27 r=%271.5%27/%3E%3Ccircle cx=%27229.7%27 cy=%27196.0%27 r=%271.5%27/%3E%3Ccircle cx=%27196.0%27 cy=%27229.7%27 r=%271.5%27/%3E%3Ccircle cx=%27150.0%27 cy=%27242.0%27 r=%271.5%27/%3E%3Ccircle cx=%27104.0%27 cy=%27229.7%27 r=%271.5%27/%3E%3Ccircle cx=%2770.3%27 cy=%27196.0%27 r=%271.5%27/%3E%3Ccircle cx=%2758.0%27 cy=%27150.0%27 r=%271.5%27/%3E%3Ccircle cx=%2770.3%27 cy=%27104.0%27 r=%271.5%27/%3E%3Ccircle cx=%27104.0%27 cy=%2770.3%27 r=%271.5%27/%3E%3Ccircle cx=%27150.0%27 cy=%2758.0%27 r=%271.5%27/%3E%3Ccircle cx=%27196.0%27 cy=%2770.3%27 r=%271.5%27/%3E%3Ccircle cx=%27229.7%27 cy=%27104.0%27 r=%271.5%27/%3E%3C/g%3E%3C/svg%3E");background-size:300px 300px;background-position:center top}

/* 顶部：初始占大半个屏，滚动或输入后收缩吸顶 */
.topbar{position:sticky;top:0;z-index:6;display:flex;align-items:center;justify-content:center;
  min-height:58vh;transition:min-height .3s var(--ease),background .2s linear}
.topbar .inner{width:100%;max-width:600px;margin:0 auto;padding:0 16px;
  display:flex;flex-direction:column;gap:12px;transition:gap .3s var(--ease)}
.topbar h1{margin:0;font-size:30px;font-weight:600;letter-spacing:-.02em;line-height:1.2;
  transition:font-size .3s var(--ease)}
.topbar .meta{margin:0;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums;
  transition:opacity .2s linear,max-height .3s var(--ease);overflow:hidden;max-height:24px}
.field input{display:block;width:100%;height:46px;padding:0 14px;border:1px solid var(--line);
  border-radius:12px;background:var(--card);font:inherit;font-size:15px;color:var(--ink);appearance:none;
  transition:height .3s var(--ease),border-radius .3s var(--ease)}
.field input::placeholder{color:var(--dim)}
.field input:focus{outline:none;border-color:#cdbfa4;box-shadow:0 0 0 3px rgba(140,90,32,.08)}
.field input:focus-visible{outline:2px solid var(--gold);outline-offset:2px}

.kinds{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
  max-height:34px;opacity:1;transition:max-height .25s var(--ease),opacity .2s linear,margin .25s}
.kinds::-webkit-scrollbar{display:none}
.topbar:not(.stuck) .kinds{max-height:0;opacity:0;margin:0}
.kinds button{flex:none;height:28px;padding:0 11px;border:1px solid var(--line);border-radius:999px;
  background:transparent;font:inherit;font-size:12px;color:var(--dim);cursor:pointer}
.kinds button[data-on='true']{border-color:var(--gold);color:var(--gold);background:rgba(140,90,32,.06)}

/* 收缩态 */
.topbar.stuck{min-height:0;background:rgba(247,244,238,.94);border-bottom:1px solid var(--line)}
.topbar.stuck .inner{gap:8px;padding-top:9px;padding-bottom:9px}
.topbar.stuck h1{font-size:15px;font-weight:500}
.topbar.stuck .meta{max-height:0;opacity:0}
.topbar.stuck .field input{height:38px;border-radius:10px;font-size:14px}

.wrap{position:relative;z-index:1;max-width:600px;margin:0 auto;padding:8px 16px 48px}
.g{margin:16px 0 0;animation:up .2s var(--ease) both;animation-delay:calc(var(--i)*24ms)}
.g.s{animation:none}
.g:nth-of-type(n+9){animation:none}
.g h2{display:flex;align-items:baseline;gap:8px;margin:0 0 8px;font-size:14px;font-weight:600}
.g h2 .c{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.g h2 .k{margin-left:auto;flex:none;font-size:12px;font-weight:400;color:var(--dim);font-variant-numeric:tabular-nums}
ul{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
li+li{border-top:1px solid var(--line)}
a{display:flex;align-items:center;gap:12px;min-height:62px;padding:11px 14px;text-decoration:none;color:inherit;transition:background .12s ease}
a:active{background:#f3eee4}
a:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.ext{flex:none;width:38px;height:38px;border-radius:9px;background:var(--chip);display:flex;
  align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--gold)}
.n{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.n b{font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.n i{font-style:normal;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.dl{flex:none;font-size:12px;color:var(--gold)}
.empty{color:var(--dim);font-size:13px;text-align:center;padding:36px 0;margin:0}
footer{margin-top:26px;text-align:center;font-size:12px;color:var(--dim)}
.sign{display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0 0;
  font-family:Georgia,"Times New Roman","Songti SC",serif;font-style:italic;
  font-size:13px;letter-spacing:.14em;color:var(--gold);opacity:.75}
.ava{width:22px;height:22px;border-radius:50%;object-fit:cover;filter:saturate(.85)}
@keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(hover:hover){a:hover{background:#faf7f1}}
@media(prefers-reduced-motion:reduce){.topbar,.topbar .inner,.topbar h1,.topbar .meta,.field input,.kinds{transition:none}.g{animation:none}}
</style>
</head>
<body>
<header class="topbar" id="topbar">
  <div class="inner">
    <h1>课程资料</h1>
    <p class="meta" id="meta" aria-live="polite">加载中…</p>
    <div class="field"><input id="q" aria-label="搜索文件名或课程" placeholder="搜索文件名或课程" /></div>
    <div class="kinds" id="kinds"></div>
  </div>
</header>

<div class="wrap">
  <div id="list" aria-live="polite"></div>
  <footer id="foot"></footer>
  <p class="sign"><img class="ava" src="brand/avatar.png" alt="" onerror="this.remove()" />ShenFall</p>
</div>
<script>
(function(){
  var data=null,total=0,kind='all',key='';
  var bar=document.getElementById('topbar'),q=document.getElementById('q');
  var MAP={pdf:'文档',doc:'文档',docx:'文档',dot:'文档',txt:'文档',md:'文档',
           xls:'表格',xlsx:'表格',csv:'表格',tsv:'表格',
           ppt:'幻灯片',pptx:'幻灯片',
           png:'图片',jpg:'图片',jpeg:'图片',gif:'图片',webp:'图片',svg:'图片',
           zip:'压缩',rar:'压缩','7z':'压缩'};
  function size(n){ if(n<1024) return n+' B'; if(n<1048576) return (n/1024).toFixed(1)+' KB'; return (n/1048576).toFixed(1)+' MB'; }
  function ext(n){ var i=n.lastIndexOf('.'); return i<0 ? 'FILE' : n.slice(i+1).toUpperCase().slice(0,4); }
  function kindOf(n){ var i=n.lastIndexOf('.'); var e=i<0?'':n.slice(i+1).toLowerCase(); return MAP[e]||'其他'; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  function sync(){
    var stuck = window.scrollY>40 || key.length>0 || document.activeElement===q;
    bar.classList.toggle('stuck', stuck);
  }

  function buildKinds(){
    var seen={},order=['文档','表格','幻灯片','图片','压缩','其他'],box=document.getElementById('kinds');
    data.courses.forEach(function(c){ c.items.forEach(function(i){ var k=kindOf(i.name); seen[k]=(seen[k]||0)+1; }); });
    var html='<button type="button" data-k="all" data-on="'+(kind==='all')+'">全部 '+total+'</button>';
    order.forEach(function(k){ if(seen[k]) html+='<button type="button" data-k="'+k+'" data-on="'+(kind===k)+'">'+k+' '+seen[k]+'</button>'; });
    box.innerHTML=html;
    Array.prototype.forEach.call(box.querySelectorAll('button'),function(b){
      b.addEventListener('click',function(){ kind=b.getAttribute('data-k'); buildKinds(); render(true); sync(); });
    });
  }

  function render(animate){
    var box=document.getElementById('list');
    if(!data){ box.innerHTML=''; return; }
    var html='',n=0;
    data.courses.forEach(function(c){
      var items=c.items.filter(function(i){
        var okq=!key||i.name.toLowerCase().indexOf(key)>=0||c.name.toLowerCase().indexOf(key)>=0;
        return okq && (kind==='all'||kindOf(i.name)===kind);
      });
      if(!items.length) return;
      var idx=Math.min(n,7),cls=animate?'g':'g s';
      html+='<section class="'+cls+'" style="--i:'+idx+'"><h2><span class="c">'+esc(c.name)+'</span>'
          +'<span class="k">'+items.length+' 个文件</span></h2><ul>';
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
    buildKinds(); render(true); sync();
  }).catch(function(){
    data=null;total=0;
    document.getElementById('meta').textContent='清单读不出来，请刷新页面';
    document.getElementById('list').innerHTML='';
    document.getElementById('kinds').innerHTML='';
    document.getElementById('foot').textContent='';
  });

  q.addEventListener('input',function(e){ key=(e.target.value||'').trim().toLowerCase(); render(false); sync(); });
  q.addEventListener('focus',sync);
  q.addEventListener('blur',function(){ setTimeout(sync,120); });
  window.addEventListener('scroll',sync,{passive:true});
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

  const brandDir = await portal.getDirectoryHandle('brand', { create: true })
  for (const [name, from] of [['avatar.png', '/brand/avatar.png']]) {
    try {
      const res = await fetch(from)
      if (!res.ok) continue
      const file = await brandDir.getFileHandle(name, { create: true })
      const w = await file.createWritable()
      await w.write(await res.blob())
      await w.close()
    } catch {
      // 缺图不影响整站
    }
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
