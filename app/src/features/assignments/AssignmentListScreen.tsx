import { useState } from 'react'
import type { Assignment } from '../../db'
import './assignments.css'

type Props = {
  assignments: Assignment[]
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onCreate: (input: { course: string; title: string; due: string }) => void
  onImportRoster: () => void
}

const STATUS_LABEL: Record<string, string> = {
  open: '草稿',
  reconciling: '进行中',
  closed: '已结束',
}

function toInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`
}

function dueText(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function AssignmentListScreen({
  assignments,
  paidCounts,
  onOpen,
  onCreate,
  onImportRoster,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(() => {
    const d = new Date()
    d.setHours(23, 59, 0, 0)
    return toInputValue(d)
  })

  const valid = course.trim().length > 0 && title.trim().length > 0 && due

  function submit() {
    if (!valid) return
    onCreate({
      course: course.trim(),
      title: title.trim(),
      due: new Date(due).toISOString(),
    })
    setSheetOpen(false)
    setCourse('')
    setTitle('')
  }

  return (
    <main className="al">
      <header className="al-top">
        <span className="al-brand">拾课</span>
        <button type="button" className="al-import" onClick={onImportRoster}>
          名单
        </button>
      </header>

      <div className="al-body">
        <p className="al-eyebrow">清点</p>

        {assignments.length === 0 && (
          <p className="al-empty">还没有清点，先建一个</p>
        )}

        {assignments.map((a) => (
          <button
            key={a.id}
            type="button"
            className="al-card"
            data-status={a.status}
            onClick={() => onOpen(a.id)}
          >
            <span className="al-card-top">
              <span className="al-card-title">
                {a.course} · {a.title}
              </span>
              <span className="al-badge" data-status={a.status}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </span>
            <span className="al-card-meta">
              {dueText(a.due)} 截止 · {paidCounts[a.id] ?? 0}/{a.total} 已交
            </span>
          </button>
        ))}
      </div>

      <div className="al-bottom">
        <button
          type="button"
          className="al-new"
          onClick={() => setSheetOpen(true)}
        >
          新建清点
        </button>
      </div>

      {sheetOpen && (
        <div className="al-sheet-wrap" onClick={() => setSheetOpen(false)}>
          <div className="al-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="al-sheet-title">新建清点</p>

            <label className="al-field">
              <span>课程</span>
              <input
                value={course}
                autoFocus
                placeholder="数据结构"
                onChange={(e) => setCourse(e.target.value)}
              />
            </label>

            <label className="al-field">
              <span>标题</span>
              <input
                value={title}
                placeholder="作业 5"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="al-field">
              <span>截止</span>
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="al-submit"
              disabled={!valid}
              onClick={submit}
            >
              创建
            </button>
            <p className="al-hint">
              默认按当前名单 {assignments[0]?.total ?? 0} 人建，所有人都是未交
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
