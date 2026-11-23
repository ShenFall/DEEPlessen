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
<meta name="theme-color" content="#f7f4ee" />
<title>课程资料</title>
<style>
  :root{--bg:#f7f4ee;--card:#fff;--line:#e6e0d5;--ink:#1a1f2a;--dim:#616875;--gold:#8c5a20;--chip:#f0ebe1}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;color:var(--ink);background:radial-gradient(120% 55% at 82% -8%,#fdfaf3 0%,var(--bg) 58%);
    font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
  .wrap{position:relative;max-width:600px;margin:0 auto;padding:28px 16px 56px;overflow:hidden}
  .orbit{position:absolute;top:-70px;right:-60px;width:260px;height:260px;pointer-events:none;opacity:.5}
  h1{position:relative;margin:0;font-size:24px;font-weight:600;letter-spacing:-.02em}
  .meta{margin:6px 0 16px;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums}
  .search{position:sticky;top:0;z-index:5;padding:8px 0 12px;background:linear-gradient(var(--bg) 70%,transparent)}
  input{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;
    background:var(--card);font-size:14px;color:var(--ink)}
  input:focus{outline:none;border-color:#cdbfa4;box-shadow:0 0 0 3px rgba(140,90,32,.08)}
  h2{display:flex;align-items:baseline;gap:8px;margin:24px 0 8px;font-size:14px;font-weight:600}
  h2 span{font-size:12px;font-weight:400;color:var(--dim)}
  ul{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  li+li{border-top:1px solid var(--line)}
  a{display:flex;align-items:center;gap:12px;padding:13px 14px;text-decoration:none;color:inherit;transition:background .12s}
  a:hover{background:#faf7f1}
  a:active{background:#f3eee4}
  .ext{flex:none;width:38px;height:38px;border-radius:9px;background:var(--chip);display:flex;
    align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--gold)}
  .n{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .n b{font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .n i{font-style:normal;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
  .dl{flex:none;font-size:12px;color:var(--gold)}
  .empty{color:var(--dim);font-size:13px;text-align:center;padding:36px 0}
  footer{margin-top:28px;text-align:center;font-size:12px;color:var(--dim)}
</style>
</head>
<body>
<div class="wrap">
  <svg class="orbit" viewBox="0 0 260 260" fill="none" aria-hidden="true">
    <circle cx="130" cy="130" r="118" stroke="#d9c9a8" stroke-width="1" stroke-dasharray="2 6"/>
    <circle cx="130" cy="130" r="86" stroke="#d9c9a8" stroke-width="1" stroke-dasharray="1 7"/>
    <circle cx="130" cy="130" r="54" stroke="#cdb894" stroke-width="1"/>
    <circle cx="130" cy="16" r="2.5" fill="#c39a5c"/>
    <circle cx="212" cy="176" r="1.8" fill="#c39a5c"/>
    <circle cx="70" cy="205" r="1.4" fill="#d9c9a8"/>
  </svg>
  <h1>课程资料</h1>
  <p class="meta" id="meta">加载中…</p>
  <div class="search"><input id="q" placeholder="搜索文件名或课程" /></div>
  <div id="list"></div>
  <footer id="foot"></footer>
</div>
<script>
(function(){
  var data = null;
  function size(n){ if(n<1024) return n+' B'; if(n<1048576) return Math.round(n/1024)+' KB'; return (n/1048576).toFixed(1)+' MB'; }
  function ext(n){ var i=n.lastIndexOf('.'); return i<0 ? 'FILE' : n.slice(i+1).toUpperCase().slice(0,4); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
  function render(q){
    var box = document.getElementById('list');
    if(!data){ box.innerHTML = '<p class="empty">没有资料</p>'; return; }
    var key = (q||'').trim().toLowerCase();
    var html = '';
    data.courses.forEach(function(c){
      var items = c.items.filter(function(i){
        return !key || i.name.toLowerCase().indexOf(key) >= 0 || c.name.toLowerCase().indexOf(key) >= 0;
      });
      if(!items.length) return;
      html += '<h2>' + esc(c.name) + '<span>' + items.length + ' 个文件</span></h2><ul>';
      items.forEach(function(i){
        html += '<li><a href="' + i.url + '" download>'
             +  '<span class="ext">' + ext(i.name) + '</span>'
             +  '<span class="n"><b>' + esc(i.name) + '</b><i>' + size(i.size) + '</i></span>'
             +  '<span class="dl">下载</span></a></li>';
      });
      html += '</ul>';
    });
    box.innerHTML = html || '<p class="empty">没有匹配的资料</p>';
  }
  fetch('manifest.json').then(function(r){ return r.json(); }).then(function(d){
    data = d;
    var n = d.courses.reduce(function(a,c){ return a + c.items.length; }, 0);
    document.getElementById('meta').textContent = n + ' 个文件 · ' + d.courses.length + ' 门课';
    var d2 = new Date(d.generatedAt);
    document.getElementById('foot').textContent = isNaN(d2.getTime()) ? '点击文件名直接下载'
      : '更新于 ' + (d2.getMonth()+1) + ' 月 ' + d2.getDate() + ' 日';
    render('');
  }).catch(function(){
    document.getElementById('meta').textContent = '清单读不出来，请刷新页面';
  });
  document.getElementById('q').addEventListener('input', function(e){ render(e.target.value); });
})();
</script>
</body>
</html>`

export type PortalResult = { files: number; courses: number }

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
  let count = 0

  for (const m of manifests) {
    const slugDir = (await publishDir.getDirectoryHandle(m.slug)) as DirHandle
    const srcFiles = (await slugDir.getDirectoryHandle('files')) as DirHandle
    const dest = (await filesDir.getDirectoryHandle(m.slug, {
      create: true,
    })) as DirHandle

    for (const item of m.items) {
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

  return { files: count, courses: courses.size }
}
