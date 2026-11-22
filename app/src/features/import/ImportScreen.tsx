import { useRef, useState } from 'react'
import { db, resetToSeed, type Student } from '../../db'
import type { ParseResult } from '../../lib/parseRoster'
import './import.css'

type Props = {
  onCancel: () => void
  onDone: () => void
}

export default function ImportScreen({ onCancel, onDone }: Props) {
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const okCount = result?.rows.filter((r) => r.state === 'ok').length ?? 0
  const warnCount = result?.rows.filter((r) => r.state === 'warn').length ?? 0
  const badCount = result?.rows.filter((r) => r.state === 'bad').length ?? 0
  const usable = result?.rows.filter((r) => r.state !== 'bad') ?? []

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    setFileName(file.name)
    try {
      // 解析器只在真正导入时才下载，不进首屏
      const { parseRoster } = await import('../../lib/parseRoster')
      const parsed = await parseRoster(file)
      setResult(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    }
  }

  async function apply() {
    if (!usable.length) return
    setBusy(true)
    try {
      const existing = await db.students.toArray()
      const bySid = new Map(
        existing.filter((s) => s.sid).map((s) => [s.sid, s]),
      )
      const byName = new Map(existing.map((s) => [s.name, s]))
      const keep = new Set<string>()

      const next: Student[] = usable.map((r, i) => {
        const old = r.sid ? bySid.get(r.sid) : byName.get(r.name)
        const id = old?.id ?? `s_${r.sid || r.name || `n${i}`}`
        keep.add(id)
        return { id, sid: r.sid, name: r.name, active: true }
      })

      await db.transaction('rw', db.students, async () => {
        await db.students.bulkPut(next)
        for (const s of existing) {
          if (!keep.has(s.id)) await db.students.update(s.id, { active: false })
        }
      })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : '写入失败')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setResult(null)
    setFileName('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      window.setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    setBusy(true)
    try {
      await resetToSeed()
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="imp">
      <header className="imp-top">
        <button type="button" className="imp-back" onClick={onCancel}>
          ←
        </button>
        <span className="imp-crumb">导入名单</span>
      </header>

      <div className="imp-body">
        {!result && (
          <label
            className="imp-pick"
            data-over={dragOver}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              void handleFile(e.dataTransfer.files[0])
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <span className="imp-pick-main">选择 .xlsx 文件</span>
            <span className="imp-pick-sub">也可以把文件拖到这里</span>
          </label>
        )}

        {error && <p className="imp-error">{error}</p>}

        {result && (
          <>
            <p className="imp-file">{fileName}</p>

            <div className="imp-stats">
              <div>
                <b>{okCount}</b>
                <span>可导入</span>
              </div>
              <div data-tone={warnCount ? 'warn' : undefined}>
                <b>{warnCount}</b>
                <span>需确认</span>
              </div>
              <div data-tone={badCount ? 'bad' : undefined}>
                <b>{badCount}</b>
                <span>跳过</span>
              </div>
            </div>

            <p className="imp-meta">
              表头第 {(result.headerRow ?? 0) + 1} 行 · 学号第 {(result.sidCol ?? 0) + 1} 列 ·
              姓名第 {(result.nameCol ?? 0) + 1} 列
            </p>

            {[...result.warnings, ...result.rows.filter((r) => r.note).map((r) => `${r.name || r.sid}：${r.note}`)]
              .slice(0, 5)
              .map((w) => (
                <p className="imp-warn" key={w}>
                  {w}
                </p>
              ))}

            <ul className="imp-list">
              {result.rows.slice(0, 8).map((r, i) => (
                <li key={`${r.sid}-${i}`} data-state={r.state}>
                  <span className="imp-name">{r.name || '—'}</span>
                  <span className="imp-sid">{r.sid || '—'}</span>
                </li>
              ))}
              {result.rows.length > 8 && (
                <li className="imp-more">… 共 {result.rows.length} 行</li>
              )}
            </ul>

            <button
              type="button"
              className="imp-apply"
              disabled={!usable.length || busy}
              onClick={() => void apply()}
            >
              {busy ? '写入中…' : `导入 ${usable.length} 人`}
            </button>
            <button type="button" className="imp-again" onClick={reset}>
              换一个文件
            </button>
          </>
        )}

        <button
          type="button"
          className="imp-reset"
          data-armed={confirmReset}
          disabled={busy}
          onClick={() => void handleReset()}
        >
          {confirmReset ? '再点一次，清空并回到示例名单' : '重置为示例名单'}
        </button>
      </div>
    </main>
  )
}
