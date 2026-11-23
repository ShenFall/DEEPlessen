import './mobile-tabs.css'

export type TabKey = 'todos' | 'list' | 'dashboard'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  {
    key: 'dashboard',
    label: '看板',
    icon: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4z',
  },
  {
    key: 'todos',
    label: '待办',
    icon: 'M4 6h12M4 12h12M4 18h8',
  },
  {
    key: 'list',
    label: '点名',
    icon: 'M5 4h10a1 1 0 0 1 1 1v14l-6-3-6 3V5a1 1 0 0 1 1-1z',
  },
]

/** 手机底部导航：只在 ≤720px 出现 */
export default function MobileTabs({
  active,
  onNav,
}: {
  active: TabKey
  onNav: (key: TabKey) => void
}) {
  return (
    <nav className="mtabs" aria-label="底部导航">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          data-on={active === t.key}
          onClick={() => onNav(t.key)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d={t.icon}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
