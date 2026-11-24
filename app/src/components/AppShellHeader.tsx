import { useState } from 'react'
import { applyTheme, currentTheme, nextTheme } from '../lib/theme'
import './shell.css'

export type ShellNav = 'dashboard' | 'todos' | 'list' | 'library'

const NAV: { key: ShellNav; label: string }[] = [
  { key: 'dashboard', label: '看板' },
  { key: 'list', label: '作业' },
  { key: 'library', label: '资料' },
]

type Props = {
  active: ShellNav
  onNav: (key: ShellNav) => void
  /** 右侧附加操作，例如「名单」 */
  right?: React.ReactNode
}

/** 所有一级页面共用这一条顶栏：左品牌、右导航 */
export default function AppShellHeader({ active, onNav, right }: Props) {
  const [theme, setTheme] = useState(() => currentTheme())
  const dark = theme === 'night'

  return (
    <header className="sh-bar">
      <div className="sh-inner">
        <button
          type="button"
          className="sh-brand"
          onClick={() => onNav('dashboard')}
          aria-label="回看板"
        >
          <span className="sh-mark">深时</span>
        </button>
        <span className="sh-motto">十年饮冰　难凉热血</span>

        <button
          type="button"
          className="sh-theme"
          aria-label={dark ? '切到白天' : '切到深夜'}
          title={dark ? '切到白天' : '切到深夜'}
          onClick={() => {
            const next = nextTheme(theme)
            applyTheme(next)
            setTheme(next)
          }}
        >
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <nav className="sh-nav" aria-label="主导航">
          {NAV.map((n) => (
            <button
              key={n.key}
              type="button"
              data-on={active === n.key}
              onClick={() => onNav(n.key)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {right ? <div className="sh-right">{right}</div> : null}
      </div>
    </header>
  )
}
