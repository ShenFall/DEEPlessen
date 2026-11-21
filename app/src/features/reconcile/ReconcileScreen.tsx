import { useEffect, useMemo, useState } from 'react'
import { ACTIVE_ROSTER, ASSIGNMENT } from '../../data/roster'
import './reconcile.css'

type Filter = 'all' | 'unpaid' | 'paid'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '未交' },
  { key: 'paid', label: '已交' },
]

export default function ReconcileScreen() {
  const [paid, setPaid] = useState<Set<string>>(() => new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)

  const total = ACTIVE_ROSTER.length
  const paidCount = paid.size
  const unpaidCount = total - paidCount
  const percent = total === 0 ? 0 : (paidCount / total) * 100

  const students = useMemo(() => {
    if (filter === 'unpaid') return ACTIVE_ROSTER.filter((s) => !paid.has(s.id))
    if (filter === 'paid') return ACTIVE_ROSTER.filter((s) => paid.has(s.id))
    return ACTIVE_ROSTER
  }, [filter, paid])

  function toggle(id: string, name: string) {
    const wasPaid = paid.has(id)
    const next = new Set(paid)
    if (wasPaid) next.delete(id)
    else next.add(id)
    setPaid(next)
    setToast(wasPaid ? null : { id, name })
  }

  function undo() {
    if (!toast) return
    const next = new Set(paid)
    next.delete(toast.id)
    setPaid(next)
    setToast(null)
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const dueText = new Date(ASSIGNMENT.due).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <main className="rs">
      <header className="rs-top">
        <div className="rs-nav">
          <span className="rs-back" aria-hidden="true">
            ←
          </span>
          <span className="rs-crumb">作业</span>
          <span className="rs-count">
            <b>{paidCount}</b>
            <i>/{total}</i>
          </span>
        </div>

        <h1 className="rs-title">
          {ASSIGNMENT.course} · {ASSIGNMENT.title}
        </h1>

        <div className="rs-progress" role="progressbar" aria-valuenow={paidCount} aria-valuemin={0} aria-valuemax={total}>
          <span style={{ width: `${percent}%` }} />
        </div>

        <div className="rs-meta">
          <span>● 演示数据 · 刷新还原</span>
          <span>{dueText} 截止</span>
        </div>

        <div className="rs-chips">
          {FILTERS.map((f) => {
            const count = f.key === 'unpaid' ? unpaidCount : f.key === 'paid' ? paidCount : total
            return (
              <button
                key={f.key}
                type="button"
                className="chip"
                data-active={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.key === 'all' ? f.label : `${f.label} ${count}`}
              </button>
            )
          })}
        </div>
      </header>

      <div className="rs-grid">
        {students.map((s) => {
          const isPaid = paid.has(s.id)
          return (
            <button
              key={s.id}
              type="button"
              className="cell"
              data-state={isPaid ? 'paid' : 'unpaid'}
              aria-pressed={isPaid}
              aria-label={`${s.name}，${isPaid ? '已交' : '未交'}`}
              onClick={() => toggle(s.id, s.name)}
            >
              {s.name}
            </button>
          )
        })}
      </div>

      <div className="rs-bottom">
        <span className="rs-hint">点名字标记 · 再点一次复原</span>
        <button type="button" className="rs-remain" onClick={() => setFilter('unpaid')}>
          剩 {unpaidCount}
        </button>
      </div>

      {toast && (
        <div className="rs-toast" role="status" aria-live="polite">
          <span>
            已标记 <b>{toast.name}</b>
          </span>
          <button type="button" onClick={undo}>
            撤销
          </button>
        </div>
      )}
    </main>
  )
}
