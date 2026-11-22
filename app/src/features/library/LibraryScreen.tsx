import { useCallback, useEffect, useRef, useState } from 'react'
import { loadHandle, saveHandle } from '../../db'
import {
  copyIntoLibrary,
  ensureDir,
  hasPermission,
  isSupported,
  listMaterials,
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

export default function LibraryScreen({ onBack }: { onBack: () => void }) {
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null)
  const [granted, setGranted] = useState(false)
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [course, setCourse] = useState('未分类')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setEntries(await listMaterials(handle))
  }, [])

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
      <header className="lb-top">
        <button type="button" className="lb-back" onClick={onBack}>
          <span aria-hidden="true">←</span>
          今日
        </button>
      </header>

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
              <span className="lb-count">{entries.length} 个文件</span>
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

            <ul className="lb-list">
              {entries.length === 0 && (
                <li className="lb-empty">资料库还是空的</li>
              )}
              {entries.map((e) => (
                <li key={e.path}>
                  <span className="lb-name">{e.name}</span>
                  <span className="lb-meta">{sizeText(e.size)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {notice && <p className="lb-notice">{notice}</p>}
      </div>
    </main>
  )
}
