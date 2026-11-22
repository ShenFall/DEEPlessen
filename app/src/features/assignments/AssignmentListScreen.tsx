import { useRef, useState } from 'react'
import type { Assignment } from '../../db'
import './assignments.css'

export type FormInput = { course: string; title: string; due: string }

type Props = {
  assignments: Assignment[]
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onCreate: (input: FormInput) => void
  onUpdate: (id: string, input: FormInput) => void
  onDelete: (id: string) => void
  onImportRoster: () => void
}

type Form = FormInput & { id?: string }

const STATUS_LABEL: Record<string, string> = {
  open: '草稿',
  reconciling: '进行中',
  closed: '已结束',
}

const LONG_PRESS = 550

function toInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`
}

/** 今天 / 明天 / 已逾期 比 "11/22 23:59" 更快读懂 */
function dueLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { text: '时间未知', overdue: false }
  const now = new Date()
  const time = d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  if (d.getTime() < now.getTime()) return { text: `已逾期 · ${time}`, overdue: true }

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  if (d.toDateString() === now.toDateString()) return { text: `今天 ${time}`, overdue: false }
  if (d.toDateString() === tomorrow.toDateString())
    return { text: `明天 ${time}`, overdue: false }
  return { text: `${d.getMonth() + 1}/${d.getDate()} ${time}`, overdue: false }
}

export default function AssignmentListScreen({
  assignments,
  paidCounts,
  onOpen,
  onCreate,
  onUpdate,
  onDelete,
  onImportRoster,
}: Props) {
  const [form, setForm] = useState<Form | null>(null)
  const [menuFor, setMenuFor] = useState<Assignment | null>(null)
  const [deleteArmed, setDeleteArmed] = useState(false)

  const pressTimer = useRef<number | undefined>(undefined)
  const longFired = useRef(false)

  const valid =
    !!form && form.course.trim().length > 0 && form.title.trim().length > 0 && !!form.due

  function openCreate() {
    const d = new Date()
    d.setHours(23, 59, 0, 0)
    setForm({ course: '', title: '', due: toInputValue(d) })
  }

  function openEdit(a: Assignment) {
    setForm({
      id: a.id,
      course: a.course,
      title: a.title,
      due: toInputValue(new Date(a.due)),
    })
  }

  function submit() {
    if (!form || !valid) return
    const payload: FormInput = {
      course: form.course.trim(),
      title: form.title.trim(),
      due: new Date(form.due).toISOString(),
    }
    if (form.id) onUpdate(form.id, payload)
    else onCreate(payload)
    setForm(null)
  }

  function handleDelete() {
    if (!menuFor) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      window.setTimeout(() => setDeleteArmed(false), 3000)
      return
    }
    onDelete(menuFor.id)
    setMenuFor(null)
    setDeleteArmed(false)
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
        <p className="al-eyebrow">清点 · 长按卡片可编辑</p>

        {assignments.length === 0 && (
          <p className="al-empty">还没有清点，先建一个</p>
        )}

        {assignments.map((a) => {
          const due = dueLabel(a.due)
          return (
            <button
              key={a.id}
              type="button"
              className="al-card"
              data-status={a.status}
              onPointerDown={() => {
                longFired.current = false
                window.clearTimeout(pressTimer.current)
                pressTimer.current = window.setTimeout(() => {
                  longFired.current = true
                  navigator.vibrate?.(10)
                  setDeleteArmed(false)
                  setMenuFor(a)
                }, LONG_PRESS)
              }}
              onPointerUp={() => window.clearTimeout(pressTimer.current)}
              onPointerLeave={() => window.clearTimeout(pressTimer.current)}
              onPointerCancel={() => window.clearTimeout(pressTimer.current)}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (longFired.current) {
                  longFired.current = false
                  return
                }
                onOpen(a.id)
              }}
            >
              <span className="al-card-top">
                <span className="al-card-title">
                  {a.course} · {a.title}
                </span>
                <span className="al-badge" data-status={a.status}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </span>
              <span className="al-card-meta" data-overdue={due.overdue}>
                {due.text} 截止 · {paidCounts[a.id] ?? 0}/{a.total} 已交
              </span>
            </button>
          )
        })}
      </div>

      <div className="al-bottom">
        <button type="button" className="al-new" onClick={openCreate}>
          新建清点
        </button>
      </div>

      {menuFor && (
        <div
          className="al-sheet-wrap"
          onClick={() => {
            setMenuFor(null)
            setDeleteArmed(false)
          }}
        >
          <div className="al-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="al-sheet-title">
              {menuFor.course} · {menuFor.title}
            </p>
            <button
              type="button"
              className="al-menu"
              onClick={() => {
                openEdit(menuFor)
                setMenuFor(null)
              }}
            >
              编辑
            </button>
            <button
              type="button"
              className="al-menu al-danger"
              onClick={handleDelete}
            >
              {deleteArmed ? '再点一次，连记录一起删' : '删除'}
            </button>
            <button
              type="button"
              className="al-menu al-muted"
              onClick={() => {
                setMenuFor(null)
                setDeleteArmed(false)
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {form && (
        <div className="al-sheet-wrap" onClick={() => setForm(null)}>
          <div className="al-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="al-sheet-title">
              {form.id ? '编辑清点' : '新建清点'}
            </p>

            <label className="al-field">
              <span>课程</span>
              <input
                value={form.course}
                autoFocus
                placeholder="数据结构"
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              />
            </label>

            <label className="al-field">
              <span>标题</span>
              <input
                value={form.title}
                placeholder="作业 5"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label className="al-field">
              <span>截止</span>
              <input
                type="datetime-local"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
              />
            </label>

            <button
              type="button"
              className="al-submit"
              disabled={!valid}
              onClick={submit}
            >
              {form.id ? '保存' : '创建'}
            </button>
            <p className="al-hint">
              {form.id
                ? '改标题和时间不会影响已标的记录'
                : `按当前名单 ${assignments[0]?.total ?? 0} 人建，所有人都是未交`}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
