/**
 * 深时 · 重建资料清单
 *
 * 用法：
 *   node tools/make-manifest.mjs "C:\path\to\deep"          # 本地目录
 *   node tools/make-manifest.mjs /www/wwwroot/deep --watch   # 服务器上
 *
 * 作用：扫描 <根>/files 下的所有文件，重新生成 manifest.json。
 * 门户只读 manifest.json，所以你在服务器上增删文件后，
 * 只要重建这个 100KB 的清单，不用重传资料。
 */

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const root = process.argv[2]
if (!root) {
  console.error('用法：node tools/make-manifest.mjs <门户根目录>')
  process.exit(1)
}

const filesDir = path.join(root, 'files')
if (!fs.existsSync(filesDir)) {
  console.error(`找不到 ${filesDir}`)
  process.exit(1)
}

const SKIP = new Set(['Thumbs.db', 'desktop.ini', '.DS_Store'])

const courses = []

const groups = (await fsp.readdir(filesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh'))

for (const g of groups) {
  const gdir = path.join(filesDir, g.name)
  const items = []
  const entries = await fsp.readdir(gdir, { withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile() || SKIP.has(e.name)) continue
    const st = await fsp.stat(path.join(gdir, e.name))
    items.push({
      name: e.name,
      size: st.size,
      url: `files/${encodeURIComponent(g.name)}/${encodeURIComponent(e.name)}`,
    })
  }
  if (items.length) courses.push({ name: g.name, items })
}

const manifest = { generatedAt: new Date().toISOString(), courses }
await fsp.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

const total = courses.reduce((n, c) => n + c.items.length, 0)
const bytes = courses.reduce((n, c) => n + c.items.reduce((m, i) => m + i.size, 0), 0)
console.log(`已重建 manifest.json：${courses.length} 个分组 / ${total} 个文件 / ${(bytes / 1048576).toFixed(1)} MB`)
for (const c of courses) console.log(`  ${c.name}  ${c.items.length}`)
