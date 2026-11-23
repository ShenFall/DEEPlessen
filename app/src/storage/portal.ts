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
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>课程资料</title>
<style>
  :root{--bg:#f7f4ee;--card:#fff;--line:#e2dcd1;--ink:#1a1f2a;--dim:#616875;--gold:#8c5a20}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
  .wrap{max-width:560px;margin:0 auto;padding:24px 16px 48px}
  h1{font-size:22px;font-weight:600;margin:0 0 4px}
  .sub{color:var(--dim);font-size:13px;margin:0 0 18px}
  input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;
    background:var(--card);font-size:14px;color:var(--ink);margin-bottom:20px}
  input:focus{outline:none;border-color:#c9bda6}
  h2{font-size:13px;font-weight:600;color:var(--dim);margin:22px 0 8px;letter-spacing:.04em}
  ul{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  li+li{border-top:1px solid var(--line)}
  a{display:flex;align-items:center;gap:10px;padding:14px 14px;text-decoration:none;color:var(--ink)}
  a:active{background:#f1ece2}
  .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .s{flex:none;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
  .dl{flex:none;font-size:12px;color:var(--gold)}
  .empty{color:var(--dim);font-size:13px;padding:28px 0;text-align:center}
  footer{margin-top:28px;color:var(--dim);font-size:12px;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <h1>课程资料</h1>
  <p class="sub" id="sub">加载中…</p>
  <input id="q" placeholder="搜索文件名或课程" />
  <div id="list"></div>
  <footer>点击文件名直接下载</footer>
</div>
<script>
(function(){
  var data = null;
  function size(n){ if(n<1024) return n+' B'; if(n<1048576) return Math.round(n/1024)+' KB'; return (n/1048576).toFixed(1)+' MB'; }
  function render(q){
    var box = document.getElementById('list');
    if(!data){ box.innerHTML='<p class="empty">没有资料</p>'; return; }
    var key = (q||'').trim().toLowerCase();
    var html = '';
    data.courses.forEach(function(c){
      var items = c.items.filter(function(i){
        return !key || i.name.toLowerCase().indexOf(key) >= 0 || c.name.toLowerCase().indexOf(key) >= 0;
      });
      if(!items.length) return;
      html += '<h2>'+c.name+' · '+items.length+'</h2><ul>';
      items.forEach(function(i){
        html += '<li><a href="'+i.url+'" download><span class="n">'+i.name+'</span>'
             +  '<span class="s">'+size(i.size)+'</span><span class="dl">下载</span></a></li>';
      });
      html += '</ul>';
    });
    box.innerHTML = html || '<p class="empty">没有匹配的资料</p>';
  }
  fetch('manifest.json').then(function(r){ return r.json(); }).then(function(d){
    data = d;
    var n = d.courses.reduce(function(a,c){ return a + c.items.length; }, 0);
    document.getElementById('sub').textContent = n + ' 个文件 · ' + d.courses.length + ' 门课';
    render('');
  }).catch(function(){
    document.getElementById('sub').textContent = '清单读不出来，请刷新';
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
