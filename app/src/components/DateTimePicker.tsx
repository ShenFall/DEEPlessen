import { useMemo, useState } from 'react'
import './datetime.css'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type StepperProps = {
  value: number
  max: number
  step?: number
  onChange: (v: number) => void
}

function Stepper({ value, max, step = 1, onChange }: StepperProps) {
  const cycle = max + step
  return (
    <span className="dtp-step">
      <button
        type="button"
        onClick={() => onChange((value - step + cycle * 2) % cycle)}
        aria-label="减少"
      >
        −
      </button>
      <b>{String(value).padStart(2, '0')}</b>
      <button
        type="button"
        onClick={() => onChange((value + step) % cycle)}
        aria-label="增加"
      >
        +
      </button>
    </span>
  )
}

type Props = {
  value?: string
  onPick: (iso?: string) => void
  onCancel: () => void
}

/** 自研日期时间选择：月历 + 时分步进，不依赖任何库 */
export default function DateTimePicker({ value, onPick, onCancel }: Props) {
  const base = value ? new Date(value) : new Date()
  const [month, setMonth] = useState(() => startOfMonth(base))
  const [day, setDay] = useState<Date | null>(value ? base : null)
  const [hour, setHour] = useState(value ? base.getHours() : 23)
  const [minute, setMinute] = useState(value ? base.getMinutes() : 0)

  const cells = useMemo(() => {
    const first = startOfMonth(month)
    const offset = (first.getDay() + 6) % 7
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const list: (number | null)[] = Array(offset).fill(null)
    for (let i = 1; i <= total; i += 1) list.push(i)
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [month])

  const today = new Date()

  function shiftMonth(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  }

  function quick(offset: number) {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    setMonth(startOfMonth(d))
    setDay(d)
  }

  function confirm() {
    if (!day) {
      onPick(undefined)
      return
    }
    const d = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hour,
      minute,
      0,
      0,
    )
    onPick(d.toISOString())
  }

  return (
    <div className="dtp">
      <div className="dtp-quick">
        <button type="button" onClick={() => quick(0)}>
          今天
        </button>
        <button type="button" onClick={() => quick(1)}>
          明天
        </button>
        <button type="button" onClick={() => quick(2)}>
          后天
        </button>
      </div>

      <div className="dtp-head">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="上个月">
          ‹
        </button>
        <span>
          {month.getFullYear()} 年 {month.getMonth() + 1} 月
        </span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="下个月">
          ›
        </button>
      </div>

      <div className="dtp-week">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="dtp-grid">
        {cells.map((c, i) => {
          if (c === null) return <span key={`e${i}`} />
          const date = new Date(month.getFullYear(), month.getMonth(), c)
          return (
            <button
              key={c}
              type="button"
              data-on={day ? sameDay(date, day) : false}
              data-today={sameDay(date, today)}
              onClick={() => setDay(date)}
            >
              {c}
            </button>
          )
        })}
      </div>

      <div className="dtp-time">
        <span className="dtp-label">时间</span>
        <Stepper value={hour} max={23} onChange={setHour} />
        <span className="dtp-colon">:</span>
        <Stepper value={minute} max={55} step={5} onChange={setMinute} />
      </div>

      <div className="dtp-actions">
        <button type="button" className="dtp-clear" onClick={() => onPick(undefined)}>
          清除
        </button>
        <button type="button" className="dtp-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="dtp-ok" onClick={confirm}>
          确定
        </button>
      </div>
    </div>
  )
}
