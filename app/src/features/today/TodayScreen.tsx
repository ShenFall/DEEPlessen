import type { Assignment } from '../../db'
import { dueLabel } from '../../lib/due'
import './today.css'

type Props = {
  assignments: Assignment[]
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onAll: () => void
  onLibrary: () => void
}

export default function TodayScreen({
  assignments,
  paidCounts,
  onOpen,
  onAll,
  onLibrary,
}: Props) {
  const open = assignments
    .filter((a) => a.status !== 'closed')
    .sort((a, b) => a.due.localeCompare(b.due))

  const dateText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <main className="td">
      <header className="td-top">
        <span className="td-brand">拾课</span>
        <span className="td-actions">
          <button type="button" className="td-link" onClick={onLibrary}>
            资料
          </button>
          <button type="button" className="td-link" onClick={onAll}>
            全部清点
          </button>
        </span>
      </header>

      <div className="td-body">
        <p className="td-eyebrow">
          {dateText} · {open.length > 0 ? `还剩 ${open.length} 件` : '没有欠账'}
        </p>

        {open.length === 0 && (
          <p className="td-empty">今天没有要收的东西</p>
        )}

        {open.map((a) => {
          const paid = paidCounts[a.id] ?? 0
          const left = Math.max(0, a.total - paid)
          const due = dueLabel(a.due)
          return (
            <button
              key={a.id}
              type="button"
              className="td-row"
              data-done={left === 0}
              onClick={() => onOpen(a.id)}
            >
              <span className="td-row-main">
                <span className="td-row-title">
                  {a.course} · {a.title}
                </span>
                <span className="td-row-meta" data-overdue={due.overdue}>
                  {due.text} · {paid}/{a.total} 已交
                </span>
              </span>
              <span className="td-row-left">
                {left === 0 ? '齐了' : `剩 ${left}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="td-bottom">
        <p className="td-hint">点一行进对账台</p>
      </div>
    </main>
  )
}
