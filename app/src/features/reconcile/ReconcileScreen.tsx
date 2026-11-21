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

const TAP_MAX_DIST = 8
const REMOVE_DELAY = 220
const RESTORE_HOLD = 350
const LONG_PRESS = 600
const STORAGE_KEY = `deep.paid.${ASSIGNMENT.id}`
const HINT_KEY = 'deep.hint.restore'
/** 「长按可恢复」最多提示两次，之后静默 */
const HINT_LIMIT = 2

const VALID_IDS = new Set(ACTIVE_ROSTER.map((s) => s.id))

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { paid?: string[] }
    return (parsed.paid ?? []).filter((id) => VALID_IDS.has(id))
  } catch {
    return []
  }
}

export default function ReconcileScreen() {
  const [initial] = useState(loadSaved)
  const [paid, setPaid] = useState<Set<string>>(() => new Set(initial))
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [holdingId, setHoldingId] = useState<string | null>(null)
  const [fading, setFading] = useState<string[]>([])
  const [forceGrid, setForceGrid] = useState(false)

  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const movedRef = useRef(false)
  const holdFiredRef = useRef(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const titleTimer = useRef<number | undefined>(undefined)

  const total = ACTIVE_ROSTER.length
  const paidCount = paid.size
  const unpaidCount = total - paidCount
  const percent = total === 0 ? 0 : (paidCount / total) * 100
  const remaining = useMemo(
    () => ACTIVE_ROSTER.filter((s) => !paid.has(s.id)),
    [paid],
  )
  const takeover = !forceGrid && remaining.length <= 2

  const students = useMemo(() => {
    if (filter === 'unpaid') {
      return ACTIVE_ROSTER.filter((s) => !paid.has(s.id) || fading.includes(s.id))
    }
    if (filter === 'paid') return ACTIVE_ROSTER.filter((s) => paid.has(s.id))
    return ACTIVE_ROSTER
  }, [filter, paid, fading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ paid: [...paid] }))
  }, [paid])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 1400)
    return () => window.clearTimeout(timer)
  }, [notice])

  function clearHold() {
    window.clearTimeout(holdTimer.current)
    setHoldingId(null)
  }

  function mark(id: string, name: string) {
    setPaid((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setToast(name)
    setForceGrid(false)

    setFlashId(id)
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 260)
    navigator.vibrate?.(15)

    if (filter === 'unpaid') {
      setFading((list) => [...list, id])
      window.setTimeout(() => {
        setFading((list) => list.filter((x) => x !== id))
      }, REMOVE_DELAY)
    }
  }

  function unmark(id: string) {
    setPaid((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY)
    setPaid(new Set())
    setFading([])
    setToast(null)
    setForceGrid(false)
    setNotice('已清空本地数据')
  }

  function handlePointerDown(
    e: ReactPointerEvent<HTMLButtonElement>,
    id: string,
    isPaid: boolean,
  ) {
    pressRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    movedRef.current = false
    holdFiredRef.current = false
    window.clearTimeout(holdTimer.current)

    if (!isPaid) return

    setHoldingId(id)
    holdTimer.current = window.setTimeout(() => {
      holdFiredRef.current = true
      setHoldingId(null)
      unmark(id)
      navigator.vibrate?.(10)
      setToast(null)
    }, RESTORE_HOLD)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const press = pressRef.current
    if (!press || movedRef.current) return
    const dist = Math.hypot(e.clientX - press.x, e.clientY - press.y)
    if (dist > TAP_MAX_DIST) {
      movedRef.current = true
      clearHold()
    }
  }

  function hintRestore() {
    const used = Number(localStorage.getItem(HINT_KEY) ?? '0')
    if (used >= HINT_LIMIT) return
    localStorage.setItem(HINT_KEY, String(used + 1))
    setNotice('长按可恢复')
  }

  function handleClick(id: string, name: string, isPaid: boolean) {
    const wasMoved = movedRef.current
    const wasHeld = holdFiredRef.current
    pressRef.current = null
    movedRef.current = false
    holdFiredRef.current = false
    clearHold()

    if (wasMoved || wasHeld) return

    if (isPaid) {
      hintRestore()
      return
    }
    mark(id, name)
  }

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

        <h1
          className="rs-title"
          onPointerDown={() => {
            titleTimer.current = window.setTimeout(resetAll, LONG_PRESS)
          }}
          onPointerUp={() => window.clearTimeout(titleTimer.current)}
          onPointerLeave={() => window.clearTimeout(titleTimer.current)}
        >
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
          <span>● 已存本地</span>
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

      {takeover ? (
        <section className="rs-finish">
          {remaining.length > 0 ? (
            <>
              <p className="rs-finish-eyebrow">还剩 {remaining.length} 人</p>
              {remaining.map((s) => (
                <div key={s.id} className="rs-finish-row">
                  <div>
                    <p className="rs-finish-name">{s.name}</p>
                    <p className="rs-finish-sub">{s.sid.slice(-2)} 号</p>
                  </div>
                  <button type="button" onClick={() => mark(s.id, s.name)}>
                    标记已交
                  </button>
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="rs-finish-eyebrow">[OK]</p>
              <p className="rs-finish-name">
                {total}/{total} 齐了
              </p>
            </>
          )}
          <button
            type="button"
            className="rs-finish-link"
            onClick={() => setForceGrid(true)}
          >
            查看名单
          </button>
        </section>
      ) : (
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
                data-holding={holdingId === s.id}
                aria-pressed={isPaid}
                aria-label={`${s.name}，${isPaid ? '已交' : '未交'}`}
                onPointerDown={(e) => handlePointerDown(e, s.id, isPaid)}
                onPointerMove={handlePointerMove}
                onPointerUp={clearHold}
                onPointerCancel={clearHold}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => handleClick(s.id, s.name, isPaid)}
              >
                {s.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="rs-bottom">
        <span className="rs-hint">点名字标记 · 长按恢复</span>
        <button type="button" className="rs-remain" onClick={() => setFilter('unpaid')}>
          剩 {unpaidCount}
        </button>
      </div>

      {toast && (
        <div className="rs-toast" role="status" aria-live="polite">
          <span>
            已标记 <b>{toast}</b>
          </span>
        </div>
      )}

      {notice && (
        <div className="rs-toast" role="status" aria-live="polite">
          <span>{notice}</span>
        </div>
      )}
    </main>
  )
}
