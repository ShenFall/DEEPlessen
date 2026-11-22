import type { Assignment, DashboardData } from '../../db'
import { dueLabel } from '../../lib/due'
import './dashboard.css'

type Props = {
  data: DashboardData
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onAll: () => void
  onLibrary: () => void
}

type ActionItem = {
  id: string
  title: string
  source: string
  time: string
  overdue: boolean
  left: number
}

/** 从真实数据里推出来的行动项，不编造业务 */
function collectActions(
  running: Assignment[],
  paidCounts: Record<string, number>,
): ActionItem[] {
  return running
    .filter((a) => a.status !== 'closed')
    .map((a) => {
      const paid = paidCounts[a.id] ?? 0
      const due = dueLabel(a.due)
      return {
        id: a.id,
        title: `${a.course} · ${a.title}`,
        source: '作业',
        time: due.text,
        overdue: due.overdue,
        left: Math.max(0, a.total - paid),
      }
    })
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
      return a.time.localeCompare(b.time)
    })
}

export default function DashboardScreen({
  data,
  paidCounts,
  onOpen,
  onAll,
  onLibrary,
}: Props) {
  const running = [...data.running].sort((a, b) => a.due.localeCompare(b.due))
  const actions = collectActions(running, paidCounts).slice(0, 5)
  const upcoming = running.slice(0, 4)

  const dateText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const headline =
    data.unpaidCount > 0
      ? `还有 ${data.unpaidCount} 人次没收`
      : data.openCount > 0
        ? '都收齐了'
        : '暂时没有要收的'

  return (
    <main className="db">
      <nav className="db-rail" aria-label="主导航">
        <span className="db-rail-logo" title="ShenFall" aria-label="深 ShenFall">
          深
        </span>
        <button type="button" className="db-rail-item" data-on="true">
          看板
        </button>
        <button type="button" className="db-rail-item" onClick={onAll}>
          作业
        </button>
        <button type="button" className="db-rail-item" onClick={onLibrary}>
          资料
        </button>
        <span className="db-rail-soon">待办</span>
        <span className="db-rail-soon">通知</span>
      </nav>

      <div className="db-main">
        <header className="db-head">
          <div>
            <p className="db-eyebrow">{dateText}</p>
            <h1 className="db-headline">{headline}</h1>
          </div>
          <span className="db-mark">拾课</span>
        </header>

        <div className="db-grid">
          <section className="db-panel db-panel--now">
            <div className="db-panel-head">
              <p className="db-panel-title">现在要做</p>
              <span className="db-panel-meta">{actions.length} 项</span>
            </div>

            {actions.length === 0 && (
              <p className="db-quiet">没有待处理的事</p>
            )}

            <ul className="db-actions">
              {actions.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="db-action"
                    onClick={() => onOpen(a.id)}
                  >
                    <span className="db-action-main">
                      <span className="db-action-title">{a.title}</span>
                      <span className="db-action-sub">
                        <span className="db-tag">作业</span>
                        <span data-overdue={a.overdue}>{a.time}</span>
                        <span>剩 {a.left}</span>
                      </span>
                    </span>
                    <span className="db-action-go">去点名</span>
                  </button>
                </li>
              ))}
            </ul>

            {running.length > actions.length && (
              <button type="button" className="db-more" onClick={onAll}>
                查看全部 {running.length} 个清点
              </button>
            )}
          </section>

          <section className="db-panel db-panel--next">
            <div className="db-panel-head">
              <p className="db-panel-title">接下来</p>
            </div>
            {upcoming.length === 0 && <p className="db-quiet">暂无截止</p>}
            <ul className="db-timeline">
              {upcoming.map((a) => {
                const due = dueLabel(a.due)
                return (
                  <li key={a.id}>
                    <span className="db-dot" data-overdue={due.overdue} />
                    <span className="db-time" data-overdue={due.overdue}>
                      {due.text}
                    </span>
                    <span className="db-what">
                      {a.course} · {a.title}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="db-panel">
            <div className="db-panel-head">
              <p className="db-panel-title">作业</p>
              <button type="button" className="db-link" onClick={onAll}>
                全部
              </button>
            </div>
            <div className="db-figures">
              <div>
                <b>{data.openCount}</b>
                <span>进行中</span>
              </div>
              <div>
                <b>{data.unpaidCount}</b>
                <span>待收</span>
              </div>
              <div>
                <b>{data.paidTotal}</b>
                <span>已收</span>
              </div>
            </div>
          </section>

          <section className="db-panel">
            <div className="db-panel-head">
              <p className="db-panel-title">资料</p>
              <button type="button" className="db-link" onClick={onLibrary}>
                打开
              </button>
            </div>
            <p className="db-quiet">
              {data.publishCount > 0
                ? `${data.publishCount} 个已发布包 · ${data.materialCount} 个文件`
                : '还没有发布过的资料包'}
            </p>
            <button type="button" className="db-ghost" onClick={onLibrary}>
              进资料库
            </button>
          </section>
        </div>
      </div>
    </main>
  )
}
