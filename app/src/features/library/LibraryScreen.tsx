import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShellHeader, { type ShellNav } from '../../components/AppShellHeader'
import {
  exportAll,
  importAll,
  listPublishes,
  loadHandle,
  saveHandle,
  savePublish,
  type Backup,
  type Publish,
} from '../../db'
import { publishCourseLocal, unpublishLocal } from '../../storage/local'
import { exportPortal } from '../../storage/portal'
import {
  copyIntoLibrary,
  ensureDir,
  hasPermission,
  isSupported,
  listMaterials,
  listPublishManifests,
  pickLibraryRoot,
  sanitize,
  type LibraryEntry,
} from '../../fs'
import './library.css'

const HANDLE_KEY = 'libraryRoot'

function sizeText(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** materials/<课程>/<文件> → 课程 */
function courseOf(path: string) {
  return path.split('/')[1] ?? '未分类'
}

type Kind = 'slide' | 'doc' | 'sheet' | 'image' | 'code' | 'other'

const KIND_LABEL: Record<Kind, string> = {
  slide: '讲义',
  doc: '文档',
  sheet: '表格',
  image: '图片',
  code: '压缩/代码',
  other: '其他',
}

const KIND_ORDER: Kind[] = ['slide', 'doc', 'sheet', 'image', 'code', 'other']

/** 按扩展名自动归类，不要求你手工打标 */
function kindOf(name: string): Kind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['pdf', 'ppt', 'pptx', 'key'].includes(ext)) return 'slide'
  if (['doc', 'docx', 'md', 'txt', 'rtf'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'sheet'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'py', 'c', 'cpp', 'java', 'js', 'ts'].includes(
      ext,
    )
  )
    return 'code'
  return 'other'
}

export default function LibraryScreen({
  onNav,
  onRestored,
}: {
  onNav: (key: ShellNav) => void
  onRestored: () => void
}) {
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null)
  const [granted, setGranted] = useState(false)
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [course, setCourse] = useState('未分类')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const [publishes, setPublishes] = useState<Publish[]>([])
  const [offarm, setOffarm] = useState<string | null>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hit = entries.filter(
      (e) =>
        (kind === 'all' || kindOf(e.name) === kind) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          courseOf(e.path).toLowerCase().includes(q)),
    )
    const map = new Map<string, LibraryEntry[]>()
    for (const e of hit) {
      const course = courseOf(e.path)
      const list = map.get(course)
      if (list) list.push(e)
      else map.set(course, [e])
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name, 'zh')
          : b.lastModified - a.lastModified,
      )
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh'))
  }, [entries, query, kind, sort])

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      const k = kindOf(e.name)
      counts[k] = (counts[k] ?? 0) + 1
    }
    return counts
  }, [entries])

  const totalSize = useMemo(
    () => entries.reduce((sum, e) => sum + e.size, 0),
    [entries],
  )

  const refresh = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setEntries(await listMaterials(handle))

    // 发布记录以磁盘上的 manifest 为准，DB 只是缓存
    const manifests = await listPublishManifests(handle)
    for (const m of manifests) {
      await savePublish({
        id: m.slug,
        course: m.course,
        state: 'local',
        items: m.items,
        createdAt: m.createdAt,
      })
    }
    setPublishes(await listPublishes())
  }, [])

  const refreshPublishes = useCallback(async () => {
    setPublishes(await listPublishes())
  }, [])

  useEffect(() => {
    void refreshPublishes()
  }, [refreshPublishes])

  useEffect(() => {
    if (!isSupported()) return
    void (async () => {
      const saved = await loadHandle<FileSystemDirectoryHandle>(HANDLE_KEY)
      if (!saved) return
      setRoot(saved)
      const ok = await hasPermission(saved, false)
      setGranted(ok)
      if (ok) await refresh(saved)
    })()
  }, [refresh])

  async function choose() {
    const picked = await pickLibraryRoot()
    if (!picked) return
    await ensureDir(picked, 'materials')
    await saveHandle(HANDLE_KEY, picked)
    setRoot(picked)
    setGranted(true)
    await refresh(picked)
    setNotice('资料库已设置')
  }

  async function authorize() {
    if (!root) return
    const ok = await hasPermission(root, true)
    setGranted(ok)
    if (ok) {
      await refresh(root)
      setNotice('已授权')
    } else {
      setNotice('未获授权，无法读写')
    }
  }

  async function publish(course: string, files: LibraryEntry[]) {
    if (!root || busy) return
    setBusy(true)
    try {
      const result = await publishCourseLocal(
        root,
        course,
        files.map((f) => ({ name: f.name, size: f.size })),
      )
      await savePublish(result)
      await refreshPublishes()
      setNotice(`已发布 publish/${result.id}（${result.items.length} 个文件）`)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '发布失败')
    } finally {
      setBusy(false)
    }
  }

  async function unpublish(p: Publish) {
    if (!root || busy) return
    if (offarm !== p.id) {
      setOffarm(p.id)
      window.setTimeout(() => setOffarm((cur) => (cur === p.id ? null : cur)), 3000)
      return
    }
    setBusy(true)
    try {
      await unpublishLocal(root, p.id)
      await savePublish({ ...p, state: 'offline' })
      await refreshPublishes()
      setOffarm(null)
      setNotice(`已下架 ${p.id}`)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '下架失败')
    } finally {
      setBusy(false)
    }
  }

  async function copySlug(slug: string) {
    try {
      await navigator.clipboard.writeText(slug)
      setNotice('已复制 slug')
    } catch {
      setNotice(slug)
    }
  }

  async function makePortal() {
    if (!root || busy) return
    setBusy(true)
    try {
      const res = await exportPortal(root)
      const big =
        res.skipped.length > 0
          ? `；${res.skipped.length} 个超 25MB 未打包，见 large-files.md`
          : ''
      setNotice(
        `学生门户已导出到 portal/（${res.courses} 门课 · ${res.files} 个文件）${big}`,
      )
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function exportBackup() {    try {
      const data = await exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      a.href = url
      a.download = `deep-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`
      a.click()
      URL.revokeObjectURL(url)
      setNotice('已导出备份')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '导出失败')
    }
  }

  async function readBackup(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Backup
      if (data.app !== 'deep' || !Array.isArray(data.students)) {
        setNotice('这不是拾课的备份文件')
        return
      }
      setPending(data)
    } catch {
      setNotice('文件读不出来，可能不是 JSON')
    }
  }

  async function applyBackup() {
    if (!pending) return
    try {
      await importAll(pending)
      setPending(null)
      setNotice('已恢复备份')
      onRestored()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '恢复失败')
    }
  }

  async function importFiles(files: FileList | null) {
    if (!root || !files || files.length === 0) return
    setBusy(true)
    try {
      let written = 0
      for (const file of Array.from(files)) {
        const res = await copyIntoLibrary(root, sanitize(course), file)
        if (res.written) written += 1
      }
      await refresh(root)
      setNotice(
        written === 0 ? '内容重复，没有新增' : `已收录 ${written} 个文件`,
      )
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '写入失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="lb">
      <AppShellHeader active="library" onNav={onNav} />

      <div className="lb-body">
        <p className="lb-title">资料库</p>

        {!isSupported() && (
          <p className="lb-warn">
            当前浏览器不支持读写本地目录，请用电脑版 Edge 打开
          </p>
        )}

        {isSupported() && !root && (
          <div className="lb-pick">
            <p className="lb-pick-main">选一个文件夹当资料库</p>
            <p className="lb-pick-sub">
              建议放在 D 盘，例如 D:\DEEP。文件只存在你自己的电脑上。
            </p>
            <button type="button" className="lb-primary" onClick={() => void choose()}>
              选择文件夹
            </button>
          </div>
        )}

        {root && !granted && (
          <div className="lb-pick">
            <p className="lb-pick-main">需要重新授权</p>
            <p className="lb-pick-sub">
              浏览器重启后会收回目录权限，点一下就行。
            </p>
            <button type="button" className="lb-primary" onClick={() => void authorize()}>
              授权访问
            </button>
          </div>
        )}

        {root && granted && (
          <>
            <div className="lb-head">
              <span className="lb-count">
                {entries.length} 个文件 · {sizeText(totalSize)}
              </span>
              <button
                type="button"
                className="lb-link"
                onClick={() => void choose()}
              >
                换目录
              </button>
            </div>

            <label className="lb-course">
              <span>收进</span>
              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="未分类"
              />
            </label>

            <label
              className="lb-drop"
              data-over={over}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setOver(false)
                void importFiles(e.dataTransfer.files)
              }}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={(e) => void importFiles(e.target.files)}
              />
              {busy ? '写入中…' : '把文件拖进来，或点击选择'}
            </label>

            <input
              className="lb-search"
              value={query}
              placeholder="搜文件名或课程"
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="lb-filters">
              <div className="lb-chips">
                <button
                  type="button"
                  data-on={kind === 'all'}
                  onClick={() => setKind('all')}
                >
                  全部 {entries.length}
                </button>
                {KIND_ORDER.filter((k) => kindCounts[k]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    data-on={kind === k}
                    onClick={() => setKind(k)}
                  >
                    {KIND_LABEL[k]} {kindCounts[k]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="lb-sort"
                onClick={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))}
              >
                {sort === 'recent' ? '最近' : '名称'}
              </button>
            </div>

            {entries.length === 0 && <p className="lb-empty">资料库还是空的</p>}
            {entries.length > 0 && groups.length === 0 && (
              <p className="lb-empty">没有匹配的文件</p>
            )}

            {groups.map(([course, list]) => (
              <section className="lb-group" key={course}>
                <div className="lb-group-head">
                  <p className="lb-group-title">
                    {course}
                    <span>{list.length}</span>
                  </p>
                  <button
                    type="button"
                    className="lb-publish"
                    onClick={() => void publish(course, list)}
                  >
                    发布
                  </button>
                </div>
                <ul className="lb-list">
                  {list.map((e) => (
                    <li key={e.path}>
                      <span className="lb-name">{e.name}</span>
                      <span className="lb-meta">{sizeText(e.size)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {publishes.length > 0 && (
              <section className="lb-group">
                <div className="lb-group-head">
                  <p className="lb-group-title">
                    已发布
                    <span>{publishes.length}</span>
                  </p>
                  <button
                    type="button"
                    className="lb-publish"
                    onClick={() => void makePortal()}
                  >
                    导出学生门户
                  </button>
                </div>
                <ul className="lb-list">
                  {publishes.map((p) => (
                    <li key={p.id} className="lb-pub-row">
                      <span className="lb-pub-main">
                        <span className="lb-name">
                          {p.course} · {p.items.length} 个文件
                        </span>
                        <span className="lb-pub-slug">
                          {p.id}
                          {p.state === 'offline' ? ' · 已下架' : ''}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="lb-pub-act"
                        onClick={() => void copySlug(p.id)}
                      >
                        复制
                      </button>
                      {p.state !== 'offline' && (
                        <button
                          type="button"
                          className="lb-pub-act"
                          data-armed={offarm === p.id}
                          onClick={() => void unpublish(p)}
                        >
                          {offarm === p.id ? '确认下架' : '下架'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <section className="lb-backup">
          <p className="lb-backup-title">数据备份</p>
          <p className="lb-backup-note">
            名单、清点、待办都存在这台电脑的浏览器里。换网址或清缓存会丢，建议定期导出。
          </p>

          {pending ? (
            <div className="lb-backup-confirm">
              <p className="lb-backup-warn">
                将用备份覆盖现有数据（{pending.assignments.length} 个清点 ·{' '}
                {pending.todos.length} 条待办）
              </p>
              <div className="lb-backup-row">
                <button
                  type="button"
                  className="lb-primary"
                  onClick={() => void applyBackup()}
                >
                  确认覆盖
                </button>
                <button
                  type="button"
                  className="lb-link"
                  onClick={() => setPending(null)}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="lb-backup-row">
              <button
                type="button"
                className="lb-primary"
                onClick={() => void exportBackup()}
              >
                导出备份
              </button>
              <label className="lb-backup-input">
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => void readBackup(e.target.files?.[0])}
                />
                <span>导入备份</span>
              </label>
            </div>
          )}
        </section>

        {notice && <p className="lb-notice">{notice}</p>}
      </div>
    </main>
  )
}
