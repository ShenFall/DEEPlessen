import { useEffect, useState } from 'react'
import type { Todo } from '../db'
import './sheet.css'

type Props = {
  todo: Todo
  onClose: () => void
  onSave: (id: string, patch: { title: string; note: string; due?: string }) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

function toText(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`
}

/** 解析「2026-11-12 09:00」；只写日期按 23:59；不合法返回 null */
function parseText(raw: string): string | undefined | null {
  const text = raw.trim()
  if (!text) return undefined
  const m = text.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/,
  )
  if (!m) return null
  const [, y, mo, da, hh, mm] = m
  const d = new Date(
    Number(y),
    Number(mo) - 1,
    Number(da),
    hh ? Number(hh) : 23,
    mm ? Number(mm) : 59,
    0,
    0,
  )
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function TodoSheet({
  todo,
  onClose,
  onSave,
  onToggle,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(todo.title)
  const [note, setNote] = useState(todo.note ?? '')
  const [when, setWhen] = useState(toText(todo.due))
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(todo.title)
    setNote(todo.note ?? '')
    setWhen(toText(todo.due))
    setError('')
  }, [todo])

  function save() {
    const text = title.trim()
    if (!text) return
    const due = parseText(when)
    if (due === null) {
      setError('格式不对，写成 2026-11-12 09:00')
      return
    }
    onSave(todo.id, { title: text, note: note.trim(), due })
    onClose()
  }

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="sheet-title">待办详情</p>
          <button type="button" className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="sheet-field">
          <span>标题</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="要做什么"
          />
        </label>

        <label className="sheet-field sheet-field--area">
          <span>备注</span>
          <textarea
            value={note}
            rows={4}
            placeholder="补充信息：链接、教室、要求…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label className="sheet-field">
          <span>时间</span>
          <input
            value={when}
            placeholder="2026-11-12 09:00"
            onChange={(e) => {
              setWhen(e.target.value)
              setError('')
            }}
          />
        </label>

        {error ? (
          <p className="sheet-error">{error}</p>
        ) : (
          <p className="sheet-hint">
            写成 2026-11-12 09:00；只写日期则按当天 23:59
          </p>
        )}

        <div className="sheet-actions">
          <button type="button" className="sheet-main" onClick={save}>
            保存
          </button>
          <button
            type="button"
            className="sheet-sub"
            onClick={() => {
              onToggle(todo.id, !todo.done)
              onClose()
            }}
          >
            {todo.done ? '恢复' : '标记完成'}
          </button>
          <button
            type="button"
            className="sheet-danger"
            onClick={() => {
              onDelete(todo.id)
              onClose()
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
