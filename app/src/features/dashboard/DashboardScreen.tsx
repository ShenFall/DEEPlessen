import { useState } from 'react'
import type { Assignment, DashboardData, Todo } from '../../db'
import { dueLabel } from '../../lib/due'
import './dashboard.css'

type Props = {
  data: DashboardData
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onAll: () => void
  onLibrary: () => void
  onTodos: () => void
  onAddTodo: (title: string, due?: string) => void
  onToggleTodo: (id: string, done: boolean) => void
  onDeleteTodo: (id: string) => void
  onSetTodoDue: (id: string, due?: string) => void
}

type Bucket = 'overdue' | 'today' | 'later' | 'none'

const BUCKETS: { key: Bucket; label: string }[] = [
  { key: 'overdue', label: '已逾期' },
  { key: 'today', label: '今天' },
  { key: 'later', label: '接下来' },
  { key: 'none', label: '无时间' },
]

function bucketOf(due?: string): Bucket {
  if (!due) return 'none'
  const d = new Date(due)
  if (Number.isNaN(d.getTime())) return 'none'
  const now = new Date()
  if (d.getTime() < now.getTime()) return 'overdue'
  if (d.toDateString() === now.toDateString()) return 'today'
  return 'later'
}

type When = 'none' | 'today' | 'tomorrow'

const WHENS: { key: When; label: string }[] = [
  { key: 'none', label: '无时间' },
  { key: 'today', label: '今天' },
  { key: 'tomorrow', label: '明天' },
]

/** 只给日期不给钟点：这些事不精确到分钟 */
function dueFor(when: When): string | undefined {
  if (when === 'none') return undefined
  const d = new Date()
  if (when === 'tomorrow') d.setDate(d.getDate() + 1)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

function toDateValue(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function fromDateValue(value: string): string | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T23:59:00`)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

type Row =
  | { kind: 'todo'; todo: Todo; bucket: Bucket; done: boolean }
  | {
      kind: 'assignment'
      assignment: Assignment
      bucket: Bucket
      left: number
      overdue: boolean
      time: string
    }

export default function DashboardScreen({
  data,
  paidCounts,
  onOpen,
  onAll,
  onLibrary,
  onTodos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onSetTodoDue,
}: Props) {
  const [draft, setDraft] = useState('')
  const [preset, setPreset] = useState<When>('none')
  const [customDate, setCustomDate] = useState('')
  /** 刚勾掉的先留在原地变灰，刷新后才归入已完成 */
  const [justDone, setJustDone] = useState<Todo[]>([])

  const rows: Row[] = [
    ...data.todos.map<Row>((t) => ({
      kind: 'todo',
      todo: t,
      bucket: bucketOf(t.due),
      done: false,
    })),
    ...justDone.map<Row>((t) => ({
      kind: 'todo',
      todo: t,
      bucket: bucketOf(t.due),
      done: true,
    })),
    ...data.running.map<Row>((a) => {
      const paid = paidCounts[a.id] ?? 0
      const due = dueLabel(a.due)
      return {
        kind: 'assignment',
        assignment: a,
        bucket: bucketOf(a.due),
        left: Math.max(0, a.total - paid),
        overdue: due.overdue,
        time: due.text,
      }
    }),
  ]

  const total = rows.length

  function submit() {
    const text = draft.trim()
    if (!text) return
    onAddTodo(text, customDate ? fromDateValue(customDate) : dueFor(preset))
    setDraft('')
    setPreset('none')
    setCustomDate('')
  }

  function toggle(t: Todo, done: boolean) {
    if (done) setJustDone((list) => [...list, t])
    else setJustDone((list) => list.filter((x) => x.id !== t.id))
    onToggleTodo(t.id, done)
  }

  return (
    <main className="db">
      <div className="db-main">
        <header className="db-head">
          <div>
            <p className="db-eyebrow">
              {new Date().toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </p>
            <h1 className="db-headline">
              {total > 0 ? `还有 ${total} 件事` : '今天清空了'}
            </h1>
          </div>
          <nav className="db-nav" aria-label="主导航">
            <button type="button" data-on="true">
              看板
            </button>
            <button type="button" onClick={onTodos}>
              待办
            </button>
            <button type="button" onClick={onAll}>
              作业
            </button>
            <button type="button" onClick={onLibrary}>
              资料
            </button>
          </nav>
        </header>

        <div className="db-grid">
          <section className="db-panel db-panel--now">
            <div className="db-panel-head">
              <p className="db-panel-title">现在要做</p>
              <button type="button" className="db-link" onClick={onTodos}>
                全部 {total}
              </button>
            </div>

            <form
              className="db-add"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <div className="db-add-box">
                <span className="db-add-plus" aria-hidden="true">
                  ＋
                </span>
                <input
                  value={draft}
                  placeholder="记一件要做的事"
                  onChange={(e) => setDraft(e.target.value)}
                />
              </div>
              <div className="db-when">
                {WHENS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    data-on={!customDate && preset === w.key}
                    onClick={() => {
                      setPreset(w.key)
                      setCustomDate('')
                    }}
                  >
                    {w.label}
                  </button>
                ))}
                <label
                  className="db-when-date"
                  data-on={!!customDate}
                  onClick={(e) => {
                    const el = e.currentTarget.querySelector('input')
                    el?.showPicker?.()
                  }}
                >
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <span>
                    {customDate ? customDate.slice(5).replace('-', '/') : '选日期'}
                  </span>
                </label>
              </div>
            </form>

            {total === 0 && (
              <p className="db-quiet">
                还没有待办。在上面那行写一句，回车就记下。
              </p>
            )}

            {BUCKETS.map(({ key, label }) => {
              const group = rows.filter((r) => r.bucket === key)
              if (group.length === 0) return null
              return (
                <div key={key} className="db-group">
                  <p className="db-group-title">{label}</p>
                  <ul className="db-actions">
                    {group.map((r) =>
                      r.kind === 'todo' ? (
                        <li key={r.todo.id}>
                          <div className="db-row" data-done={r.done}>
                            <button
                              type="button"
                              className="db-check"
                              data-on={r.done}
                              aria-label={r.done ? '恢复' : '完成'}
                              onClick={() => toggle(r.todo, !r.done)}
                            />
                            <span className="db-row-main">
                              <span className="db-row-title">{r.todo.title}</span>
                              <span className="db-row-sub">
                                <span className="db-tag db-tag--todo">待办</span>
                                <label
                                  className="db-due"
                                  title="设置日期"
                                  onClick={(e) => {
                                    const el = e.currentTarget.querySelector('input')
                                    el?.showPicker?.()
                                  }}
                                >
                                  <input
                                    type="date"
                                    value={toDateValue(r.todo.due)}
                                    onChange={(e) =>
                                      onSetTodoDue(
                                        r.todo.id,
                                        fromDateValue(e.target.value),
                                      )
                                    }
                                  />
                                  <span data-none={!r.todo.due}>
                                    {r.todo.due
                                      ? dueLabel(r.todo.due).text
                                      : '设日期'}
                                  </span>
                                </label>
                                {r.done && <span>已完成</span>}
                              </span>
                            </span>
                            <button
                              type="button"
                              className="db-del"
                              aria-label="删除"
                              onClick={() => onDeleteTodo(r.todo.id)}
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      ) : (
                        <li key={r.assignment.id}>
                          <button
                            type="button"
                            className="db-row db-row--link"
                            onClick={() => onOpen(r.assignment.id)}
                          >
                            <span className="db-mark-dot" aria-hidden="true" />
                            <span className="db-row-main">
                              <span className="db-row-title">
                                {r.assignment.course} · {r.assignment.title}
                              </span>
                              <span className="db-row-sub">
                                <span className="db-tag">作业</span>
                                <span data-overdue={r.overdue}>{r.time}</span>
                                <span>剩 {r.left}</span>
                              </span>
                            </span>
                            <span className="db-row-go">去点名</span>
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )
            })}
          </section>

          <section className="db-panel db-panel--next">
            <div className="db-panel-head">
              <p className="db-panel-title">接下来</p>
            </div>
            {data.running.length === 0 && <p className="db-quiet">暂无截止</p>}
            <ul className="db-timeline">
              {[...data.running]
                .sort((a, b) => a.due.localeCompare(b.due))
                .slice(0, 4)
                .map((a) => {
                  const due = dueLabel(a.due)
                  return (
                    <li key={a.id}>
                      <span className="db-dot" data-overdue={due.overdue} />
                      <span className="db-time" data-overdue={due.overdue}>
                        {due.text}
                      </span>
                      <span className="db-what">
                        {a.course} · {a.title}
                      </span>
                    </li>
                  )
                })}
            </ul>
          </section>

          <section className="db-panel">
            <div className="db-panel-head">
              <p className="db-panel-title">作业</p>
              <button type="button" className="db-link" onClick={onAll}>
                全部
              </button>
            </div>
            <div className="db-figures">
              <div>
                <b>{data.openCount}</b>
                <span>进行中</span>
              </div>
              <div>
                <b>{data.unpaidCount}</b>
                <span>待收</span>
              </div>
              <div>
                <b>{data.paidTotal}</b>
                <span>已收</span>
              </div>
            </div>
            {data.openCount === 0 && (
              <p className="db-quiet">没有进行中的清点</p>
            )}
          </section>

          <section className="db-panel">
            <div className="db-panel-head">
              <p className="db-panel-title">资料</p>
            </div>
            <p className="db-quiet">
              {data.publishCount > 0
                ? `${data.publishCount} 个已发布包 · ${data.materialCount} 个文件`
                : '还没有发布过的资料包'}
            </p>
            <button type="button" className="db-ghost" onClick={onLibrary}>
              进资料库
            </button>
          </section>
        </div>
      </div>
    </main>
  )
}
