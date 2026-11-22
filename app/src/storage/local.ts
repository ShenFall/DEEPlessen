import type { Publish, PublishItem } from '../db'
import { ensureDir, sanitize } from '../fs'

/**
 * 本地发布：把课程下选中的文件复制到 publish/<slug>/files/，
 * 并写一份 manifest.json。学生端将来读的就是这个结构。
 *
 * 等对象存储定了，只需把"写本地"换成"上传"，manifest 结构不动。
 */
export async function publishCourseLocal(
  root: FileSystemDirectoryHandle,
  course: string,
  files: { name: string; size: number }[],
): Promise<Publish> {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
  const slug = `${sanitize(course).replace(/\s+/g, '-')}-${stamp}-${Math.random()
    .toString(36)
    .slice(2, 6)}`

  const dir = await ensureDir(root, 'publish', slug)
  const filesDir = await dir.getDirectoryHandle('files', { create: true })
  const materials = await root.getDirectoryHandle('materials')
  const courseDir = await materials.getDirectoryHandle(course)

  const items: PublishItem[] = []
  for (const f of files) {
    const src = await courseDir.getFileHandle(f.name)
    const data = await src.getFile()
    const target = await filesDir.getFileHandle(f.name, { create: true })
    const writer = await target.createWritable()
    await writer.write(data)
    await writer.close()
    items.push({ name: f.name, size: f.size, file: `files/${f.name}` })
  }

  const createdAt = new Date().toISOString()
  const manifest = { slug, course, createdAt, items }
  const manifestHandle = await dir.getFileHandle('manifest.json', { create: true })
  const writer = await manifestHandle.createWritable()
  await writer.write(JSON.stringify(manifest, null, 2))
  await writer.close()

  return { id: slug, course, state: 'local', items, createdAt }
}

/** 下架：删掉 publish/<slug> 整个目录，本地库不动 */
export async function unpublishLocal(
  root: FileSystemDirectoryHandle,
  slug: string,
): Promise<void> {
  try {
    const dir = (await root.getDirectoryHandle('publish')) as FileSystemDirectoryHandle & {
      removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    }
    await dir.removeEntry(slug, { recursive: true })
  } catch {
    // 目录已经不在了，视为成功
  }
}
