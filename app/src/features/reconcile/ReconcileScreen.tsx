/**
 * 对账台 · 手机版
 *
 * 三件事：
 * 1. 一屏放下 28 个人，点一下标记，位置永不重排（ADR-0002）
 * 2. 手指抖动不算点击（8px / 500ms），滚动时不会误标
 * 3. 标错了随时能退：toast 里 3.5 秒内可撤，底栏常驻可撤
 *
 * 刻意没做的：按名单顺序"引导下一个"——学生是随机走上来的，
 * 顺序引导在真实场景里没有意义（见 docs/decisions/0009）。
 */
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

export default function ReconcileScreen() {
  /** 已交的人。用 Set 而不是数组：判断「这个人交没交」是 O(1) */
  const [paid, setPaid] = useState<Set<string>>(() => new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [fading, setFading] = useState<string[]>([])
  /** 标记历史，栈顶就是「上一步」 */
  const [history, setHistory] = useState<string[]>([])

  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const movedRef = useRef(false)

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

  const lastId = history[history.length - 1]
  const lastName = lastId
    ? ACTIVE_ROSTER.find((s) => s.id === lastId)?.name ?? ''
    : ''

  function mark(id: string, name: string) {
    const next = new Set(paid)
    next.add(id)
    setPaid(next)
    setHistory((h) => [...h, id])
    setToast({ id, name })

    // 视觉反馈是主通道（部分安卓机的震动被系统关掉了）
    setFlashId(id)
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 260)
    navigator.vibrate?.(15)

    // 「未交」视图是队列语义：先淡出，再移除
    if (filter === 'unpaid') {
      setFading((list) => [...list, id])
      window.setTimeout(() => {
        setFading((list) => list.filter((x) => x !== id))
      }, REMOVE_DELAY)
    }
  }

  function unmark(id: string) {
    const next = new Set(paid)
    next.delete(id)
    setPaid(next)
    setHistory((h) => h.filter((x) => x !== id))
    setToast((cur) => (cur?.id === id ? null : cur))
  }

  function handleClick(id: string, name: string) {
    const press = pressRef.current
    const wasMoved = movedRef.current
    pressRef.current = null
    movedRef.current = false

    if (wasMoved) return
    if (press && performance.now() - press.t > TAP_MAX_MS) return

    if (paid.has(id)) unmark(id)
    else mark(id, name)
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

  function undoLast() {
    if (!lastId) return
    unmark(lastId)
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

      <div className="rs-grid">
        {students.map((s) => {
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
              onClick={() => handleClick(s.id, s.name)}
            >
              {s.name}
            </button>
          )
        })}
      </div>

      <div className="rs-bottom">
        <button
          type="button"
          className="rs-undo"
          disabled={!lastId}
          onClick={undoLast}
        >
          撤销{lastName ? ` · ${lastName}` : ''}
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
          <button type="button" onClick={() => unmark(toast.id)}>
            撤销
          </button>
        </div>
      )}
    </main>
  )
}
