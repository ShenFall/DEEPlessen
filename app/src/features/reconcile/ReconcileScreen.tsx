import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
/** 「未交」视图里延迟移除，避免格子瞬间前移导致手指点到别人 */
const REMOVE_DELAY = 220

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ReconcileScreen() {
  const [paid, setPaid] = useState<Set<string>>(() => new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [nextId, setNextId] = useState<string | null>(null)
  const [fading, setFading] = useState<string[]>([])
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
    if (filter === 'unpaid') {
      // 刚标记的人先留在原位淡出，再移除
      return ACTIVE_ROSTER.filter((s) => !paid.has(s.id) || fading.includes(s.id))
    }
    if (filter === 'paid') return ACTIVE_ROSTER.filter((s) => paid.has(s.id))
    return ACTIVE_ROSTER
  }, [filter, paid, fading])

  /** 把「下一个该点的人」标出来——这才是自动前进真正要解决的事 */
  function pointToNext(index: number, marked: Set<string>) {
    const after = ACTIVE_ROSTER.slice(index + 1).find((s) => !marked.has(s.id))
    const wrap = ACTIVE_ROSTER.find((s) => !marked.has(s.id))
    const target = after ?? wrap
    setNextId(target ? target.id : null)
    return target?.id ?? null
  }

  function scrollToNext() {
    const el = gridRef.current?.querySelector<HTMLElement>('[data-next="true"]')
    if (!el) return
    const box = el.getBoundingClientRect()
    const offScreen = box.top < 60 || box.bottom > window.innerHeight - 70
    // 整屏放得下时不起作用也没关系，视觉上的高亮已经够指路
    if (!offScreen) return
    el.scrollIntoView({
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

    // 视觉反馈是主通道（震动在部分安卓机上也可能被系统关掉）
    setFlashId(id)
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 260)

    navigator.vibrate?.(15)

    if (filter === 'unpaid') {
      setFading((list) => [...list, id])
      window.setTimeout(() => {
        setFading((list) => list.filter((x) => x !== id))
      }, REMOVE_DELAY)
      return
    }

    if (filter === 'all' && autoAdvance) {
      const target = pointToNext(index, next)
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = window.setTimeout(() => {
        if (target) scrollToNext()
      }, 300)
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

  // 切换视图时，之前指的目标可能已经不在屏幕上了
  useEffect(() => {
    setNextId(null)
  }, [filter])

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
              data-next={nextId === s.id}
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
              {nextId === s.id && <span className="cell-caret" aria-hidden="true" />}
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
          自动指下一个 · {autoAdvance ? '开' : '关'}
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
