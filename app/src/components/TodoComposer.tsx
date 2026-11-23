import { useState } from 'react'
import './todo-composer.css'

type When = 'none' | 'today' | 'tomorrow'

const WHENS: { key: When; label: string }[] = [
  { key: 'none', label: '无时间' },
  { key: 'today', label: '今天' },
  { key: 'tomorrow', label: '明天' },
]

function dueFor(when: When): string | undefined {
  if (when === 'none') return undefined
  const d = new Date()
  if (when === 'tomorrow') d.setDate(d.getDate() + 1)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

function fromDateValue(value: string): string | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T23:59:00`)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

type Props = {
  onAdd: (title: string, due?: string) => void
  placeholder?: string
}

/** 看板与待办页共用的录入条 */
export default function TodoComposer({
  onAdd,
  placeholder = '记一件要做的事',
}: Props) {
  const [draft, setDraft] = useState('')
  const [preset, setPreset] = useState<When>('none')
  const [customDate, setCustomDate] = useState('')

  function submit() {
    const text = draft.trim()
    if (!text) return
    onAdd(text, customDate ? fromDateValue(customDate) : dueFor(preset))
    setDraft('')
    setPreset('none')
    setCustomDate('')
  }

  return (
    <form
      className="tc"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="tc-box">
        <span className="tc-plus" aria-hidden="true">
          ＋
        </span>
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="tc-go" aria-label="保存">
          ↵
        </button>
      </div>

      <div className="tc-when">
        {WHENS.map((w) => (
          <button
            key={w.key}
            type="button"
            data-on={!customDate && preset === w.key}
            onClick={() => {
              setPreset(w.key)
              setCustomDate('')
            }}
          >
            {w.label}
          </button>
        ))}
        <label
          className="tc-date"
          data-on={!!customDate}
          onClick={(e) => {
            const el = e.currentTarget.querySelector('input')
            el?.showPicker?.()
          }}
        >
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
          <span>{customDate ? customDate.slice(5).replace('-', '/') : '选日期'}</span>
        </label>
      </div>
    </form>
  )
}
