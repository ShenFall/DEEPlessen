import AppShellHeader, { type ShellNav } from '../../components/AppShellHeader'
import type { Todo } from '../../db'
import { dueLabel } from '../../lib/due'
import './todos.css'

type Props = {
  todos: Todo[]
  onNav: (key: ShellNav) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, due?: string) => void
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
  onSetDue,
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
                  <span className="tz-main">
                    <span className="tz-name">{t.title}</span>
                    <span className="tz-sub">
                      <label
                        className="tz-due"
                        title="设置日期"
                        onClick={(e) => {
                          const el = e.currentTarget.querySelector('input')
                          el?.showPicker?.()
                        }}
                      >
                        <input
                          type="date"
                          value={toDateValue(t.due)}
                          onChange={(e) =>
                            onSetDue(t.id, fromDateValue(e.target.value))
                          }
                        />
                        <span data-none={!t.due}>
                          {t.due ? dueLabel(t.due).text : '设日期'}
                        </span>
                      </label>
                    </span>
                  </span>
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
                  <span className="tz-main">
                    <span className="tz-name">{t.title}</span>
                    <span className="tz-sub">{doneText(t.doneAt)}</span>
                  </span>
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
