import AppShellHeader, { type ShellNav } from '../../components/AppShellHeader'
import TodoComposer from '../../components/TodoComposer'
import type { Assignment, DashboardData, Todo } from '../../db'
import { dueLabel } from '../../lib/due'
import './dashboard.css'

type Props = {
  data: DashboardData
  paidCounts: Record<string, number>
  onNav: (key: ShellNav) => void
  onOpen: (id: string) => void
  onAll: () => void
  onLibrary: () => void
  onTodos: () => void
  onAddTodo: (title: string, due?: string) => void
  doneTodos: Todo[]
  onToggleTodo: (id: string, done: boolean) => void | Promise<void>
  onDeleteTodo: (id: string) => void
  onOpenTodo: (todo: Todo) => void
  onOpenAssignment: (assignment: Assignment) => void
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
  doneTodos,
  paidCounts,
  onNav,
  onOpen,
  onAll,
  onLibrary,
  onTodos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onOpenTodo,
  onOpenAssignment,
}: Props) {
  /** 刚勾掉的先留在原地变灰，刷新后才归入已完成 */

  const rows: Row[] = [
    ...data.todos.map<Row>((t) => ({
      kind: 'todo',
      todo: t,
      bucket: bucketOf(t.due),
      done: false,
    })),
    ...doneTodos.map<Row>((t) => ({
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

  const isDone = (r: Row) => r.kind === 'todo' && r.done
  const total = rows.filter((r) => !isDone(r)).length

  function toggle(t: Todo, done: boolean) {
    void onToggleTodo(t.id, done)
  }

  return (
    <main className="db">
      <AppShellHeader active="dashboard" onNav={onNav} />

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
        </header>

        <div className="db-grid">
          <section className="db-panel db-panel--now">
            <div className="db-panel-head">
              <p className="db-panel-title">现在要做</p>
              <button type="button" className="db-link" onClick={onTodos}>
                全部 {total}
              </button>
            </div>

            <TodoComposer onAdd={onAddTodo} />

            {total === 0 && (
              <p className="db-quiet">
                还没有待办。在上面那行写一句，回车就记下。
              </p>
            )}

            {BUCKETS.map(({ key, label }) => {
              const group = rows
        .filter((r) => r.bucket === key)
        .sort((a, b) => Number(isDone(a)) - Number(isDone(b)))
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
                            >
                              <span />
                            </button>
                            <button
                              type="button"
                              className="db-row-main db-row-open"
                              onClick={() => onOpenTodo(r.todo)}
                            >
                              <span className="db-row-title">{r.todo.title}</span>
                              <span className="db-row-sub">
                                <span className="db-tag db-tag--todo">待办</span>
                                {r.todo.due && (
                                  <span data-overdue={bucketOf(r.todo.due) === 'overdue'}>
                                    {dueLabel(r.todo.due).text}
                                  </span>
                                )}
                                {r.todo.note ? <span>有备注</span> : null}
                                {r.done && <span>已完成</span>}
                              </span>
                            </button>
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
                          <div className="db-row">
                            <button
                              type="button"
                              className="db-row-main db-row-open"
                              onClick={() => onOpenAssignment(r.assignment)}
                            >
                              <span className="db-row-title">
                                {r.assignment.course} · {r.assignment.title}
                              </span>
                              <span className="db-row-sub">
                                <span className="db-tag">作业</span>
                                <span data-overdue={r.overdue}>{r.time}</span>
                                <span>剩 {r.left}</span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="db-row-go"
                              onClick={() => onOpen(r.assignment.id)}
                            >
                              去点名
                            </button>
                          </div>
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

          <section className="db-panel db-panel--lib">
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
