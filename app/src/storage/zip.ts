/**
 * 最小 ZIP 打包器：只做 store（不压缩）。
 * 课程资料本身已是 PDF/DOCX/图片，压缩收益极低，省下一个库。
 */

type Entry = { path: string; data: Uint8Array }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function dosTime(d: Date) {
  const time =
    (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  const date =
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { time, date }
}

const enc = new TextEncoder()

export function createZip(entries: Entry[]): Blob {
  const chunks: BlobPart[] = []
  const central: Uint8Array[] = []
  const now = dosTime(new Date())
  let offset = 0

  for (const entry of entries) {
    const name = enc.encode(entry.path)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const header = new DataView(new ArrayBuffer(30))
    header.setUint32(0, 0x04034b50, true)
    header.setUint16(4, 20, true)
    header.setUint16(6, 0x0800, true) // UTF-8 文件名
    header.setUint16(8, 0, true) // store
    header.setUint16(10, now.time, true)
    header.setUint16(12, now.date, true)
    header.setUint32(14, crc, true)
    header.setUint32(18, size, true)
    header.setUint32(22, size, true)
    header.setUint16(26, name.length, true)
    header.setUint16(28, 0, true)

    chunks.push(header.buffer as ArrayBuffer, name, entry.data)

    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014b50, true)
    cd.setUint16(4, 20, true)
    cd.setUint16(6, 20, true)
    cd.setUint16(8, 0x0800, true)
    cd.setUint16(10, 0, true)
    cd.setUint16(12, now.time, true)
    cd.setUint16(14, now.date, true)
    cd.setUint32(16, crc, true)
    cd.setUint32(20, size, true)
    cd.setUint32(24, size, true)
    cd.setUint16(28, name.length, true)
    cd.setUint16(30, 0, true)
    cd.setUint16(32, 0, true)
    cd.setUint16(34, 0, true)
    cd.setUint16(36, 0, true)
    cd.setUint32(38, 0, true)
    cd.setUint32(42, offset, true)
    central.push(new Uint8Array(cd.buffer), name)

    offset += 30 + name.length + size
  }

  let cdSize = 0
  for (const part of central) {
    chunks.push(part)
    cdSize += part.length
  }

  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(4, 0, true)
  eocd.setUint16(6, 0, true)
  eocd.setUint16(8, entries.length, true)
  eocd.setUint16(10, entries.length, true)
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, offset, true)
  eocd.setUint16(20, 0, true)
  chunks.push(eocd.buffer as ArrayBuffer)

  return new Blob(chunks, { type: 'application/zip' })
}

type DirHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

/** 把 portal 目录整个读进内存 */
export async function collectPortal(
  root: FileSystemDirectoryHandle,
): Promise<Entry[]> {
  const portal = (await root.getDirectoryHandle('portal')) as DirHandle
  const out: Entry[] = []

  async function walk(dir: DirHandle, prefix: string) {
    for await (const [name, handle] of dir.entries()) {
      const path = prefix ? `${prefix}/${name}` : name
      if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile()
        const buf = new Uint8Array(await file.arrayBuffer())
        out.push({ path, data: buf })
      } else {
        await walk(handle as DirHandle, path)
      }
    }
  }

  await walk(portal, '')
  return out
}
