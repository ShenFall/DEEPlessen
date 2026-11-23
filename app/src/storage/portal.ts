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
  background:radial-gradient(110% 46% at 84% -8%,rgba(140,90,32,.06),transparent 62%),var(--bg);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}

/* 构成主义拼贴：两块斜切 + 两根细线 */
.art{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.frag{position:absolute;mix-blend-mode:multiply;will-change:transform}
.frag--a{right:-5%;top:-14%;height:120vh;opacity:.15;
  clip-path:polygon(26% 0,100% 0,100% 100%,0 100%)}
.frag--b{left:-14%;bottom:-18%;height:64vh;opacity:.09;transform:rotate(180deg);
  clip-path:polygon(0 0,100% 0,74% 100%,0 100%)}
.rule{position:absolute;top:0;width:1px;background:linear-gradient(var(--line),transparent)}
.rule--a{right:24%;height:42vh}
.rule--b{right:calc(24% + 8px);height:26vh;opacity:.6}

/* 顶部 */
.topbar{position:fixed;left:0;right:0;top:50dvh;transform:translateY(-50%);z-index:6;
  display:flex;align-items:center;justify-content:center;
  transition:top .32s var(--ease),transform .32s var(--ease),background .2s linear}
.space{height:100dvh}
.topbar .inner{width:100%;max-width:600px;margin:0 auto;padding:0 16px;
  display:flex;flex-direction:column;gap:10px;transition:gap .3s var(--ease)}
.who{display:flex;align-items:center;gap:8px;font-family:Georgia,"Times New Roman","Songti SC",serif;
  font-style:italic;font-size:13px;letter-spacing:.14em;color:var(--gold);opacity:.85;
  transition:opacity .2s linear,max-height .3s var(--ease);max-height:28px;overflow:hidden}
.ava{width:24px;height:24px;border-radius:50%;object-fit:cover;filter:saturate(.85)}
h1{margin:0;font-size:30px;font-weight:600;letter-spacing:-.02em;line-height:1.2;
  transition:font-size .3s var(--ease)}
.meta{margin:0;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums;
  transition:opacity .2s linear,max-height .3s var(--ease);max-height:24px;overflow:hidden}
.field input{display:block;width:100%;height:46px;padding:0 14px;border:1px solid var(--line);
  border-radius:12px;background:var(--card);font:inherit;font-size:15px;color:var(--ink);appearance:none;
  transition:height .3s var(--ease),border-radius .3s var(--ease)}
.field input::placeholder{color:var(--dim)}
.field input:focus,.field input:focus-visible{outline:none;border-color:#cdbfa4;box-shadow:0 0 0 3px rgba(140,90,32,.10)}
.kinds{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
  max-height:34px;opacity:1;transition:max-height .25s var(--ease),opacity .2s linear}
.kinds::-webkit-scrollbar{display:none}
.kinds button{flex:none;height:28px;padding:0 11px;border:1px solid var(--line);border-radius:999px;
  background:transparent;font:inherit;font-size:12px;color:var(--dim);cursor:pointer}
.kinds button[data-on='true']{border-color:var(--gold);color:var(--gold);background:rgba(140,90,32,.06)}
.topbar:not(.stuck) .kinds{max-height:0;opacity:0}

.topbar.stuck{top:0;transform:none;background:rgba(247,244,238,.96);
  border-bottom:1px solid var(--line);box-shadow:0 1px 0 rgba(140,90,32,.04)}
.topbar.stuck .inner{gap:8px;padding-top:8px;padding-bottom:8px}
.topbar.stuck h1{font-size:15px;font-weight:500}
.topbar.stuck .who{max-height:0;opacity:0}
.topbar.stuck .meta{max-height:0;opacity:0}
.topbar.stuck .field input{height:38px;border-radius:10px;font-size:14px}

.wrap{position:relative;z-index:1;max-width:600px;margin:0 auto;padding:10px 16px 40px}
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
.motto{margin:34px 0 0;padding-top:18px;border-top:1px solid var(--line);text-align:center;
  font-family:Georgia,"Songti SC",serif;font-size:13px;letter-spacing:.22em;color:var(--gold);opacity:.72}
@keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(hover:hover){a:hover{background:#faf7f1}}
@media(prefers-reduced-motion:reduce){
  .topbar,.topbar .inner,.topbar h1,.who,.meta,.field input,.kinds{transition:none}
  .g{animation:none}}
</style>
</head>
<body>
<div class="art" aria-hidden="true">
  <img class="frag frag--a" src="brand/lines.png" alt="" onerror="this.remove()" />
  <img class="frag frag--b" src="brand/lines.png" alt="" onerror="this.remove()" />
  <i class="rule rule--a"></i><i class="rule rule--b"></i>
</div>

<header class="topbar" id="topbar">
  <div class="inner">
    <div class="who"><img class="ava" src="brand/avatar.png" alt="" onerror="this.remove()" />ShenFall</div>
    <h1>课程资料</h1>
    <p class="meta" id="meta" aria-live="polite">加载中…</p>
    <div class="field"><input id="q" aria-label="搜索文件名或课程" placeholder="搜索文件名或课程" /></div>
    <div class="kinds" id="kinds"></div>
  </div>
</header>
<div class="space" aria-hidden="true"></div>

<div class="wrap">
  <div id="list" aria-live="polite"></div>
  <p class="motto">十年饮冰　难凉热血</p>
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
  function fscore(text,q){
    var t=String(text).toLowerCase();q=String(q).toLowerCase().trim();
    if(!q) return 1;
    var i=t.indexOf(q); if(i>=0) return 1000-Math.min(i,300);
    var cur=0,last=-1,hit=0,gaps=0;
    for(var k=0;k<q.length;k++){
      var ch=q.charAt(k); if(ch===' ') continue;
      var f=t.indexOf(ch,cur); if(f<0) return 0;
      if(last>=0) gaps+=f-last-1;
      hit++; last=f; cur=f+1;
    }
    return Math.max(1,200-gaps*4-(t.length-hit));
  }
  function fbest(fields,q){
    q=String(q).trim(); if(!q) return 1;
    var tokens=q.toLowerCase().split(/\s+/),best=0;
    fields.forEach(function(f){
      var sum=0;
      for(var i=0;i<tokens.length;i++){
        var sc=fscore(f,tokens[i]);
        if(sc===0){ sum=0; break; }
        sum+=sc;
      }
      if(sum>best) best=sum;
    });
    return best;
  }

  function sync(){
    bar.classList.toggle('stuck', window.scrollY>40 || key.length>0 || document.activeElement===q);
  }

  function buildKinds(){
    var seen={},order=['文档','表格','幻灯片','图片','压缩','其他'],box=document.getElementById('kinds');
    data.courses.forEach(function(c){ c.items.forEach(function(i){ var k=kindOf(i.name); seen[k]=(seen[k]||0)+1; }); });
    var html='<button type="button" data-k="all" data-on="'+(kind==='all')+'">全部 '+total+'</button>';
    order.forEach(function(k){ if(seen[k]) html+='<button type="button" data-k="'+k+'" data-on="'+(kind===k)+'">'+k+' '+seen[k]+'</button>'; });
    box.innerHTML=html;
    Array.prototype.forEach.call(box.querySelectorAll('button'),function(b){
      b.addEventListener('click',function(){ kind=b.getAttribute('data-k'); buildKinds(); render(true); });
    });
  }

  function render(animate){
    var box=document.getElementById('list');
    if(!data){ box.innerHTML=''; return; }
    var html='',n=0;
    data.courses.forEach(function(c){
      var items=c.items.map(function(i){ return {i:i,s:key?fbest([i.name,c.name],key):1}; })
        .filter(function(x){ return x.s>0 && (kind==='all'||kindOf(x.i.name)===kind); });
      if(!items.length) return;
      if(key) items.sort(function(a,b){ return b.s-a.s; });
      var idx=Math.min(n,7),cls=animate?'g':'g s';
      html+='<section class="'+cls+'" style="--i:'+idx+'"><h2><span class="c">'+esc(c.name)+'</span>'
          +'<span class="k">'+items.length+' 个文件</span></h2><ul>';
      items.forEach(function(x){
        var f=x.i;
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
    var dt=new Date(d.generatedAt);
    var stamp=isNaN(dt.getTime())?'':(' · 更新于 '+(dt.getMonth()+1)+' 月 '+dt.getDate()+' 日');
    document.getElementById('meta').textContent=total+' 个文件 · '+data.courses.length+' 门课'+stamp;
    buildKinds(); render(true); sync();
  }).catch(function(){
    data=null;total=0;
    document.getElementById('meta').textContent='清单读不出来，请刷新页面';
    document.getElementById('list').innerHTML='';
    document.getElementById('kinds').innerHTML='';
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
  for (const [name, from] of [
    ['avatar.png', '/brand/avatar.png'],
    ['lines.png', '/brand/lines.png'],
  ]) {
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
