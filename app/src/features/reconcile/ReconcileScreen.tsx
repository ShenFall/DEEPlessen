import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  clearAssignment,
  setPaid as persistPaid,
  type Assignment,
  type Student,
} from '../../db'
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
const HINT_KEY = 'deep.hint.restore'
/** 「长按可恢复」最多提示两次，之后静默 */
const HINT_LIMIT = 2

type Props = {
  students: Student[]
  assignment: Assignment
  initialPaid: string[]
  onBack: () => void
  onOpenImport: () => void
  onToggleStatus: () => void
  onClone: () => void
}

export default function ReconcileScreen({
  students,
  assignment,
  initialPaid,
  onBack,
  onOpenImport,
  onToggleStatus,
  onClone,
}: Props) {
  const roster = useMemo(() => students.filter((s) => s.active), [students])
  const readonly = assignment.status === 'closed'
  const [paid, setPaid] = useState<Set<string>>(() => new Set(initialPaid))
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [holdingId, setHoldingId] = useState<string | null>(null)
  const [fading, setFading] = useState<string[]>([])
  const [listMode, setListMode] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const movedRef = useRef(false)
  const holdFiredRef = useRef(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const titleTimer = useRef<number | undefined>(undefined)

  const total = roster.length
  const paidCount = paid.size
  const unpaidCount = total - paidCount
  const percent = total === 0 ? 0 : (paidCount / total) * 100
  /** 全部 = 固定面板式网格；未交 / 已交 = 默认清单，可切回网格 */
  const isList = filter !== 'all' && listMode

  const visible = useMemo(() => {
    if (filter === 'unpaid') {
      return roster.filter((s) => !paid.has(s.id) || fading.includes(s.id))
    }
    if (filter === 'paid') return roster.filter((s) => paid.has(s.id))
    return roster
  }, [filter, roster, paid, fading])

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
    void persistPaid(assignment.id, id, true)

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
    void persistPaid(assignment.id, id, false)
  }

  function resetAll() {
    void clearAssignment(assignment.id)
    setPaid(new Set())
    setFading([])
    setToast(null)
    setNotice('已清空本作业的标记')
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

    if (readonly) {
      setNotice('已结束，先在 ⋯ 里恢复')
      return
    }

    if (isPaid) {
      hintRestore()
      return
    }
    mark(id, name)
  }

  const dueText = new Date(assignment.due).toLocaleString('zh-CN', {
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
          <button
            type="button"
            className="rs-backbtn"
            onClick={onBack}
            aria-label="返回清点列表"
          >
            <span aria-hidden="true">←</span>
            清点
          </button>
          <span className="rs-count">
            <b>{paidCount}</b>
            <i>/{total}</i>
          </span>
        </div>

        <div className="rs-titlerow">
          <h1
            className="rs-title"
            onPointerDown={() => {
              titleTimer.current = window.setTimeout(resetAll, LONG_PRESS)
            }}
            onPointerUp={() => window.clearTimeout(titleTimer.current)}
            onPointerLeave={() => window.clearTimeout(titleTimer.current)}
          >
            {assignment.course} · {assignment.title}
          </h1>
          <button
            type="button"
            className="rs-more"
            aria-label="更多操作"
            onClick={() => setMenuOpen(true)}
          >
            ⋯
          </button>
        </div>

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
          <span>{readonly ? '● 已结束 · 只读' : '● 已存本地'}</span>
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
          {filter !== 'all' && (
            <div className="rs-views">
              <button
                type="button"
                data-on={!listMode}
                onClick={() => setListMode(false)}
              >
                网格
              </button>
              <button
                type="button"
                data-on={listMode}
                onClick={() => setListMode(true)}
              >
                列表
              </button>
            </div>
          )}
        </div>
      </header>

      {isList ? (
        <ul className="rs-list">
          {visible.length === 0 && (
            <li className="rs-empty">
              {filter === 'unpaid' ? '都交齐了' : '还没有人交'}
            </li>
          )}
          {visible.map((s) => {
            const isPaid = paid.has(s.id)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className="rs-row"
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
                  <span className="rs-row-name">{s.name}</span>
                  <span className="rs-row-meta">
                    {s.sid ? `${s.sid.slice(-2)} 号` : '无学号'}
                  </span>
                  <span className="rs-row-state">{isPaid ? '已交' : '未交'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rs-grid">
          {visible.map((s) => {
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
        <button
          type="button"
          className="rs-remain"
          onClick={() => setFilter('unpaid')}
        >
          剩 {unpaidCount} 人
        </button>
      </div>

      {menuOpen && (
        <div className="rs-sheet-wrap" onClick={() => setMenuOpen(false)}>
          <div className="rs-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="rs-sheet-title">更多</p>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onOpenImport()
              }}
            >
              导入名单
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onClone()
              }}
            >
              复制为新的清点
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onToggleStatus()
              }}
            >
              {readonly ? '恢复清点' : '结束清点'}
            </button>
            <button
              type="button"
              className="rs-danger"
              onClick={() => {
                setMenuOpen(false)
                resetAll()
              }}
            >
              重置本作业
            </button>
          </div>
        </div>
      )}

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
