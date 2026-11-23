import AppShellHeader, { type ShellNav } from '../../components/AppShellHeader'
import type { Todo } from '../../db'
import { dueLabel } from '../../lib/due'
import './todos.css'

type Props = {
  todos: Todo[]
  onNav: (key: ShellNav) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onOpenTodo: (todo: Todo) => void
}

function doneText(iso?: string) {
  if (!iso) return '已完成'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '已完成'
  return `${d.getMonth() + 1}/${d.getDate()} 完成`
}

export default function TodosScreen({
  todos,
  onNav,
  onToggle,
  onDelete,
  onOpenTodo,
}: Props) {
  const active = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  return (
    <main className="tz">
      <AppShellHeader active="todos" onNav={onNav} />

      <div className="tz-body">
        <h1 className="tz-title">待办</h1>

        <section>
          <p className="tz-group">
            未完成 <span>{active.length}</span>
          </p>
          {active.length === 0 && (
            <p className="tz-empty">没有未完成的事</p>
          )}
          <ul className="tz-list">
            {active.map((t) => (
              <li key={t.id}>
                <div className="tz-row">
                  <button
                    type="button"
                    className="tz-check"
                    aria-label="完成"
                    onClick={() => onToggle(t.id, true)}
                  >
                    <span />
                  </button>
                  <button
                    type="button"
                    className="tz-main tz-main--open"
                    onClick={() => onOpenTodo(t)}
                  >
                    <span className="tz-name">{t.title}</span>
                    <span className="tz-sub">
                      {t.due ? dueLabel(t.due).text : '无日期'}
                      {t.note ? ' · 有备注' : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="tz-del"
                    aria-label="删除"
                    onClick={() => onDelete(t.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="tz-done">
          <p className="tz-group">
            已完成 <span>{done.length}</span>
          </p>
          {done.length === 0 && <p className="tz-empty">还没有完成的事</p>}
          <ul className="tz-list">
            {done.map((t) => (
              <li key={t.id}>
                <div className="tz-row" data-done="true">
                  <button
                    type="button"
                    className="tz-check"
                    data-on="true"
                    aria-label="恢复"
                    onClick={() => onToggle(t.id, false)}
                  >
                    <span />
                  </button>
                  <button
                    type="button"
                    className="tz-main tz-main--open"
                    onClick={() => onOpenTodo(t)}
                  >
                    <span className="tz-name">{t.title}</span>
                    <span className="tz-sub">{doneText(t.doneAt)}</span>
                  </button>
                  <button
                    type="button"
                    className="tz-del"
                    aria-label="删除"
                    onClick={() => onDelete(t.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
