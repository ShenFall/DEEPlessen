/**
 * 文件系统适配器
 *
 * 当前实现：Edge 的 File System Access API。
 * 接口刻意按 Tauri 的能力设计，将来换壳只换实现，不动业务代码。
 */

type PermissionMode = { mode: 'read' | 'readwrite' }

type PermissionHandle = FileSystemDirectoryHandle & {
  queryPermission?(opts: PermissionMode): Promise<PermissionState>
  requestPermission?(opts: PermissionMode): Promise<PermissionState>
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string
      mode?: 'read' | 'readwrite'
    }) => Promise<FileSystemDirectoryHandle>
  }
}

export const isSupported = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

/** TS 的 lib.dom 还没带 entries()，这里补一个 */
type DirHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
}

export async function pickLibraryRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (!isSupported()) throw new Error('当前浏览器不支持选择目录，请用桌面版 Edge')
  try {
    return (await window.showDirectoryPicker!({
      id: 'deep-library',
      mode: 'readwrite',
    })) ?? null
  } catch {
    // 用户取消
    return null
  }
}

export async function hasPermission(
  handle: FileSystemDirectoryHandle,
  request = false,
): Promise<boolean> {
  const h = handle as PermissionHandle
  const opts: PermissionMode = { mode: 'readwrite' }
  try {
    if (h.queryPermission) {
      const state = await h.queryPermission(opts)
      if (state === 'granted') return true
      if (!request) return false
    }
    if (request && h.requestPermission) {
      return (await h.requestPermission(opts)) === 'granted'
    }
  } catch {
    return false
  }
  return false
}

export async function ensureDir(
  root: FileSystemDirectoryHandle,
  ...names: string[]
): Promise<FileSystemDirectoryHandle> {
  let dir = root
  for (const name of names) {
    dir = await dir.getDirectoryHandle(name, { create: true })
  }
  return dir
}

export type LibraryEntry = {
  name: string
  path: string
  size: number
  lastModified: number
}

/** 只扫两层：materials/<课程>/<文件>，不递归进系统目录 */
export async function listMaterials(
  root: FileSystemDirectoryHandle,
): Promise<LibraryEntry[]> {
  const out: LibraryEntry[] = []
  try {
    const materials = (await root.getDirectoryHandle('materials')) as DirHandle
    for await (const [courseName, courseHandle] of materials.entries()) {
      if (courseHandle.kind !== 'directory') continue
      const course = courseHandle as DirHandle
      for await (const [fileName, fileHandle] of course.entries()) {
        if (fileHandle.kind !== 'file') continue
        const file = await (fileHandle as FileSystemFileHandle).getFile()
        out.push({
          name: fileName,
          path: `materials/${courseName}/${fileName}`,
          size: file.size,
          lastModified: file.lastModified,
        })
      }
    }
  } catch {
    // materials 还不存在
  }
  return out.sort((a, b) => b.lastModified - a.lastModified)
}

/** 从库目录里删掉一个文件（materials/<课程>/<文件名>） */
export async function removeMaterial(
  root: FileSystemDirectoryHandle,
  path: string,
) {
  const parts = path.split('/')
  let dir: FileSystemDirectoryHandle = root
  for (const part of parts.slice(0, -1)) {
    dir = await dir.getDirectoryHandle(part)
  }
  const removable = dir as FileSystemDirectoryHandle & {
    removeEntry(name: string): Promise<void>
  }
  await removable.removeEntry(parts[parts.length - 1])
}

export async function sha1(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 复制进库；同内容已存在就跳过，返回是否真的写了 */
export async function copyIntoLibrary(
  root: FileSystemDirectoryHandle,
  course: string,
  file: File,
): Promise<{ path: string; written: boolean }> {
  const dir = (await ensureDir(root, 'materials', course)) as DirHandle

  for await (const [, handle] of dir.entries()) {
    if (handle.kind !== 'file') continue
    const existing = await (handle as FileSystemFileHandle).getFile()
    if (existing.size !== file.size) continue
    if ((await sha1(existing)) === (await sha1(file))) {
      return { path: `materials/${course}/${handle.name}`, written: false }
    }
  }

  const safeName = sanitize(file.name)
  const target = await dir.getFileHandle(safeName, { create: true })
  const writable = await target.createWritable()
  await writable.write(file)
  await writable.close()
  return { path: `materials/${course}/${safeName}`, written: true }
}

export function sanitize(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || `file-${Date.now()}`
}

export type PublishManifest = {
  slug: string
  course: string
  createdAt: string
  items: { name: string; size: number; file: string }[]
}

/**
 * 从磁盘读回发布记录。
 * 事实来源是目录：换端口、换浏览器、清空站点数据都不会丢。
 */
export async function listPublishManifests(
  root: FileSystemDirectoryHandle,
): Promise<PublishManifest[]> {
  const out: PublishManifest[] = []
  try {
    const dir = (await root.getDirectoryHandle('publish')) as DirHandle
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind !== 'directory') continue
      try {
        const inner = handle as DirHandle
        const fileHandle = await inner.getFileHandle('manifest.json')
        const text = await (await fileHandle.getFile()).text()
        const parsed = JSON.parse(text) as PublishManifest
        if (parsed && Array.isArray(parsed.items)) {
          out.push({ ...parsed, slug: parsed.slug || name })
        }
      } catch {
        // 单个坏包不影响其它
      }
    }
  } catch {
    // publish 目录还不存在
  }
  return out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}
