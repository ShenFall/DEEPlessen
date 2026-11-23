import { useEffect, useState } from 'react'
import type { Todo } from '../db'
import DateTimePicker from './DateTimePicker'
import './sheet.css'

type Props = {
  todo: Todo
  onClose: () => void
  onSave: (id: string, patch: { title: string; note: string; due?: string }) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

function timeText(iso?: string) {
  if (!iso) return '未设置'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '未设置'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`
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
  const [due, setDue] = useState<string | undefined>(todo.due)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    setTitle(todo.title)
    setNote(todo.note ?? '')
    setDue(todo.due)
    setPicking(false)
  }, [todo])

  function save() {
    const text = title.trim()
    if (!text) return
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
            rows={3}
            placeholder="补充信息：链接、教室、要求…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="sheet-field">
          <span>时间</span>
          <button
            type="button"
            className="sheet-time"
            data-empty={!due}
            onClick={() => setPicking((v) => !v)}
          >
            {timeText(due)}
          </button>
        </div>

        {picking && (
          <DateTimePicker
            value={due}
            onPick={(iso) => {
              setDue(iso)
              setPicking(false)
            }}
            onCancel={() => setPicking(false)}
          />
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
