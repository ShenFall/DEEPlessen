import { useState } from 'react'
import DateTimePicker from './DateTimePicker'
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

function shortText(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '选日期'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`
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
  const [customDue, setCustomDue] = useState<string | undefined>(undefined)
  const [picking, setPicking] = useState(false)

  function submit() {
    const text = draft.trim()
    if (!text) return
    onAdd(text, customDue ?? dueFor(preset))
    setDraft('')
    setPreset('none')
    setCustomDue(undefined)
    setPicking(false)
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
            data-on={!customDue && preset === w.key}
            onClick={() => {
              setPreset(w.key)
              setCustomDue(undefined)
              setPicking(false)
            }}
          >
            {w.label}
          </button>
        ))}
        <button
          type="button"
          className="tc-date"
          data-on={!!customDue}
          onClick={() => setPicking((v) => !v)}
        >
          {customDue ? shortText(customDue) : '选日期'}
        </button>
      </div>

      {picking && (
        <DateTimePicker
          value={customDue}
          onPick={(iso) => {
            setCustomDue(iso)
            setPreset('none')
            setPicking(false)
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </form>
  )
}
