import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ACTIVE_ROSTER, ASSIGNMENT } from '../../data/roster'
import './reconcile.css'

type Filter = 'all' | 'unpaid' | 'paid'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '未交' },
  { key: 'paid', label: '已交' },
]

/** 手指抖动容忍度：超过这个位移就认为是在滚动，不是点击 */
const TAP_MAX_DIST = 8
/** 超过这个时长认为不是点击（留给将来的长按菜单） */
const TAP_MAX_MS = 500

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ReconcileScreen() {
  const [paid, setPaid] = useState<Set<string>>(() => new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)

  const gridRef = useRef<HTMLDivElement>(null)
  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const movedRef = useRef(false)
  const advanceTimer = useRef<number | undefined>(undefined)

  const total = ACTIVE_ROSTER.length
  const paidCount = paid.size
  const unpaidCount = total - paidCount
  const percent = total === 0 ? 0 : (paidCount / total) * 100

  const students = useMemo(() => {
    if (filter === 'unpaid') return ACTIVE_ROSTER.filter((s) => !paid.has(s.id))
    if (filter === 'paid') return ACTIVE_ROSTER.filter((s) => paid.has(s.id))
    return ACTIVE_ROSTER
  }, [filter, paid])

  /** 标记后把下一个未交的人滚到屏幕中间；没有下一个就回到第一个 */
  function advanceFrom(index: number) {
    const nodes = gridRef.current?.querySelectorAll<HTMLButtonElement>('.cell')
    if (!nodes) return
    const list = Array.from(nodes)
    const next =
      list.slice(index + 1).find((n) => n.dataset.state === 'unpaid') ??
      list.find((n) => n.dataset.state === 'unpaid')
    next?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  function toggle(id: string, name: string, index: number) {
    const wasPaid = paid.has(id)
    const next = new Set(paid)
    if (wasPaid) next.delete(id)
    else next.add(id)
    setPaid(next)

    if (wasPaid) {
      setToast(null)
      return
    }

    setToast({ id, name })

    // 视觉反馈是主通道（iOS 没有震动）
    setFlashId(id)
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 260)

    // 震动只在支持的设备上生效，拿不到就算了
    navigator.vibrate?.(15)

    if (autoAdvance && filter === 'all') {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = window.setTimeout(() => advanceFrom(index), 300)
    }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    pressRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    movedRef.current = false
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const press = pressRef.current
    if (!press || movedRef.current) return
    const dist = Math.hypot(e.clientX - press.x, e.clientY - press.y)
    if (dist > TAP_MAX_DIST) movedRef.current = true
  }

  function handleClick(id: string, name: string, index: number) {
    const press = pressRef.current
    const wasMoved = movedRef.current
    pressRef.current = null
    movedRef.current = false

    // 滚动过就不算点击
    if (wasMoved) return
    if (press && performance.now() - press.t > TAP_MAX_MS) return

    toggle(id, name, index)
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

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

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

        <div
          className="rs-progress"
          role="progressbar"
          aria-valuenow={paidCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <span style={{ width: `${percent}%` }} />
        </div>

        <div className="rs-meta">
          <span>● 演示数据 · 刷新还原</span>
          <span>{dueText} 截止</span>
        </div>

        <div className="rs-chips">
          {FILTERS.map((f) => {
            const count =
              f.key === 'unpaid' ? unpaidCount : f.key === 'paid' ? paidCount : total
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

      <div className="rs-grid" ref={gridRef}>
        {students.map((s, index) => {
          const isPaid = paid.has(s.id)
          return (
            <button
              key={s.id}
              type="button"
              className="cell"
              data-state={isPaid ? 'paid' : 'unpaid'}
              data-flash={flashId === s.id}
              aria-pressed={isPaid}
              aria-label={`${s.name}，${isPaid ? '已交' : '未交'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerCancel={() => {
                pressRef.current = null
                movedRef.current = false
              }}
              onClick={() => handleClick(s.id, s.name, index)}
            >
              {s.name}
            </button>
          )
        })}
      </div>

      <div className="rs-bottom">
        <button
          type="button"
          className="rs-toggle"
          data-on={autoAdvance}
          onClick={() => setAutoAdvance((v) => !v)}
        >
          自动跳下一个 · {autoAdvance ? '开' : '关'}
        </button>
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
