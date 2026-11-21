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
const TAP_MAX_MS = 500
const REMOVE_DELAY = 220
const LONG_PRESS = 600
const STORAGE_KEY = `deep.paid.${ASSIGNMENT.id}`

type Saved = { paid: string[]; history: string[] }

const VALID_IDS = new Set(ACTIVE_ROSTER.map((s) => s.id))

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { paid: [], history: [] }
    const parsed = JSON.parse(raw) as Partial<Saved>
    const keep = (ids?: string[]) => (ids ?? []).filter((id) => VALID_IDS.has(id))
    return { paid: keep(parsed.paid), history: keep(parsed.history) }
  } catch {
    return { paid: [], history: [] }
  }
}

export default function ReconcileScreen() {
  const [saved] = useState(loadSaved)
  const [paid, setPaid] = useState<Set<string>>(() => new Set(saved.paid))
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [fading, setFading] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>(saved.history)
  const [forceGrid, setForceGrid] = useState(false)

  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const movedRef = useRef(false)
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

  const lastId = history[history.length - 1]
  const lastName = lastId
    ? ACTIVE_ROSTER.find((s) => s.id === lastId)?.name ?? ''
    : ''

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ paid: [...paid], history }),
    )
  }, [paid, history])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  function mark(id: string, name: string) {
    const next = new Set(paid)
    next.add(id)
    setPaid(next)
    setHistory((h) => [...h, id])
    setToast({ id, name })
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
    const next = new Set(paid)
    next.delete(id)
    setPaid(next)
    setHistory((h) => h.filter((x) => x !== id))
    setToast((cur) => (cur?.id === id ? null : cur))
  }

  function undoLast() {
    if (!lastId) return
    unmark(lastId)
    setToast(null)
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY)
    setPaid(new Set())
    setHistory([])
    setFading([])
    setToast(null)
    setForceGrid(false)
    setNotice('已清空本地数据')
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
          title="长按清空本地数据"
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
      )}

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

      {notice && (
        <div className="rs-toast" role="status" aria-live="polite">
          <span>{notice}</span>
        </div>
      )}
    </main>
  )
}
