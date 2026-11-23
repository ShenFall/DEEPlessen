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
