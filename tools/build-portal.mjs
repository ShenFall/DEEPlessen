/**
 * 深时 · 资料打包脚本
 *
 * 用法：双击 tools/打包资料.bat，或在终端 node tools/build-portal.mjs
 *
 * 做的事：
 *   1. 读 I:\DataSystem（只读，绝不往里写文件）
 *   2. 在临时目录拼出学生门户（index.html + manifest.json + files/ + brand/）
 *   3. 打成 zip 放到桌面
 *   4. 打开 Cloudflare 上传页
 */

import { createHash } from 'node:crypto'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const ROOT = process.env.SHENSHI_DATA || 'I:\\DataSystem'
const REPO = path.resolve(import.meta.dirname, '..')
const TMP = path.join(os.tmpdir(), 'shenshi-portal')
const DESKTOP = path.join(os.homedir(), 'Desktop')
const MAX_FILE = 25 * 1024 * 1024
const UPLOAD_URL = 'https://dash.cloudflare.com/?to=/:account/workers-and-pages'

const SKIP_DIRS = new Set(['portal', 'publish', 'node_modules', '.git', '$RECYCLE.BIN'])
const SKIP_FILES = new Set(['Thumbs.db', 'desktop.ini', '.DS_Store'])

function log(...args) {
  console.log(...args)
}

/* ---------- 读取门户模板与品牌图 ---------- */

async function readTemplate() {
  const raw = await fsp.readFile(
    path.join(REPO, 'app', 'src', 'storage', 'portal.ts'),
    'utf8',
  )
  // 仓库里可能是 CRLF，先归一化再截取
  const src = raw.replace(/\r\n/g, '\n')
  const start = src.indexOf('const PORTAL_HTML = `')
  const end = src.indexOf('`\n\nexport type PortalResult')
  if (start < 0 || end < 0) throw new Error('找不到 PORTAL_HTML 模板')
  return src.slice(start + 'const PORTAL_HTML = `'.length, end)
}

/* ---------- 极简 zip（store，无压缩，UTF-8 文件名） ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const enc = new TextEncoder()

function buildZip(entries) {
  const parts = []
  const central = []
  const now = new Date()
  const time =
    (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
  const date =
    ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  let offset = 0

  for (const { name, data } of entries) {
    const nameBuf = enc.encode(name)
    const crc = crc32(data)
    const size = data.length

    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(20, 4)
    head.writeUInt16LE(0x0800, 6)
    head.writeUInt16LE(0, 8)
    head.writeUInt16LE(time, 10)
    head.writeUInt16LE(date, 12)
    head.writeUInt32LE(crc, 14)
    head.writeUInt32LE(size, 18)
    head.writeUInt32LE(size, 22)
    head.writeUInt16LE(nameBuf.length, 26)
    head.writeUInt16LE(0, 28)
    parts.push(head, Buffer.from(nameBuf), data)

    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(20, 4)
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(0x0800, 8)
    cd.writeUInt16LE(0, 10)
    cd.writeUInt16LE(time, 12)
    cd.writeUInt16LE(date, 14)
    cd.writeUInt32LE(crc, 16)
    cd.writeUInt32LE(size, 20)
    cd.writeUInt32LE(size, 24)
    cd.writeUInt16LE(nameBuf.length, 28)
    cd.writeUInt32LE(offset, 42)
    central.push(cd, Buffer.from(nameBuf))

    offset += 30 + nameBuf.length + size
  }

  const cdBuf = Buffer.concat(central)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(cdBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)

  return Buffer.concat([...parts, cdBuf, eocd])
}

/* ---------- 主流程 ---------- */

async function walk(dir, group, out) {
  const items = await fsp.readdir(dir, { withFileTypes: true })
  for (const item of items) {
    if (item.name.startsWith('.')) continue
    const full = path.join(dir, item.name)
    if (item.isDirectory()) {
      await walk(full, group ?? item.name, out)
      continue
    }
    if (SKIP_FILES.has(item.name)) continue
    const stat = await fsp.stat(full)
    out.push({
      group: group ?? '未分类',
      name: item.name,
      size: stat.size,
      from: full,
    })
  }
}

async function main() {
  log('')
  log('  深时 · 资料打包')
  log('  ─────────────────────────────')
  log(`  资料目录：${ROOT}`)
  log('')

  if (!fs.existsSync(ROOT)) throw new Error(`资料目录不存在：${ROOT}`)

  const files = []
  const top = await fsp.readdir(ROOT, { withFileTypes: true })
  for (const entry of top) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(ROOT, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walk(full, entry.name, files)
    } else if (!SKIP_FILES.has(entry.name)) {
      const stat = await fsp.stat(full)
      files.push({ group: '未分类', name: entry.name, size: stat.size, from: full })
    }
  }

  if (files.length === 0) throw new Error('目录里没有可打包的文件')

  // 清空临时目录（只在系统临时目录里操作）
  await fsp.rm(TMP, { recursive: true, force: true })
  await fsp.mkdir(path.join(TMP, 'files'), { recursive: true })
  await fsp.mkdir(path.join(TMP, 'brand'), { recursive: true })

  const courses = new Map()
  const skipped = []
  const entries = []

  for (const f of files) {
    if (f.size > MAX_FILE) {
      skipped.push(f)
      continue
    }
    const folder = `${f.group}-${createHash('sha1')
      .update(f.group + f.name)
      .digest('hex')
      .slice(0, 6)}`
    const destDir = path.join(TMP, 'files', folder)
    await fsp.mkdir(destDir, { recursive: true })
    await fsp.copyFile(f.from, path.join(destDir, f.name))

    const list = courses.get(f.group) ?? []
    list.push({
      name: f.name,
      size: f.size,
      url: `files/${encodeURIComponent(folder)}/${encodeURIComponent(f.name)}`,
    })
    courses.set(f.group, list)
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    courses: [...courses.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'zh'))
      .map(([name, items]) => ({ name, items })),
  }

  await fsp.writeFile(
    path.join(TMP, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )
  await fsp.writeFile(path.join(TMP, 'index.html'), await readTemplate(), 'utf8')

  for (const name of ['avatar.png', 'lines.png']) {
    const from = path.join(REPO, 'app', 'public', 'brand', name)
    if (fs.existsSync(from)) await fsp.copyFile(from, path.join(TMP, 'brand', name))
  }

  // 收集成 zip 条目
  async function collect(dir, prefix) {
    const items = await fsp.readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const full = path.join(dir, item.name)
      const rel = prefix ? `${prefix}/${item.name}` : item.name
      if (item.isDirectory()) await collect(full, rel)
      else entries.push({ name: rel, data: await fsp.readFile(full) })
    }
  }
  await collect(TMP, '')

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // 同时产出一个可直接拖拽的文件夹：zip 太大时 Cloudflare 可能当成单文件拒收
  const outDir = path.join(DESKTOP, `深时门户-${stamp}`)
  await fsp.rm(outDir, { recursive: true, force: true })
  await fsp.cp(TMP, outDir, { recursive: true })

  const zipPath = path.join(DESKTOP, `deep-portal-${stamp}.zip`)
  await fsp.writeFile(zipPath, buildZip(entries))

  const total = entries.reduce((n, e) => n + e.data.length, 0)
  const packed = files.length - skipped.length

  log(`  分组：${courses.size} 个  ·  文件：${packed} 个`)
  log(`  体积：${(total / 1048576).toFixed(1)} MB`)
  log('')
  log(`  ✅ 文件夹：${outDir}`)
  log(`  ✅ 压缩包：${zipPath}`)
  log('')
  log('  上传时优先拖「文件夹」，zip 体积过大时平台会拒收。')
  if (skipped.length) {
    log('')
    log(`  ⚠️  ${skipped.length} 个文件超过 25MB，未打包：`)
    for (const s of skipped.slice(0, 5)) log(`      ${s.name}（${(s.size / 1048576).toFixed(1)} MB）`)
  }
  log('')
  log('  下一步：把桌面上的 zip 拖进 Cloudflare 的 Create new deployment')
  log('')

  exec(`start "" "${UPLOAD_URL}"`)
}

main().catch((e) => {
  console.error('')
  console.error('  ❌ 打包失败：', e.message)
  console.error('')
  process.exitCode = 1
})
