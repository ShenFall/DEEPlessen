import type { DashboardData } from '../../db'
import { dueLabel } from '../../lib/due'
import './dashboard.css'

type Props = {
  data: DashboardData
  paidCounts: Record<string, number>
  onOpen: (id: string) => void
  onAll: () => void
  onLibrary: () => void
}

function clockText(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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
  const lead = running[0]
  const leadPaid = lead ? paidCounts[lead.id] ?? 0 : 0
  const leadLeft = lead ? Math.max(0, lead.total - leadPaid) : 0
  const pct = lead && lead.total > 0 ? (leadPaid / lead.total) * 100 : 0

  const dateText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <main className="db">
      <header className="db-top">
        <span className="db-brand">拾课</span>
        <span className="db-date">{dateText}</span>
      </header>

      <div className="db-body">
        <div className="db-kpis">
          <div>
            <b>{data.openCount}</b>
            <span>进行中</span>
          </div>
          <div data-tone={data.unpaidCount > 0 ? 'warn' : undefined}>
            <b>{data.unpaidCount}</b>
            <span>待收人次</span>
          </div>
          <div>
            <b>{data.publishCount}</b>
            <span>已发布</span>
          </div>
        </div>

        {lead ? (
          <section className="db-lead">
            <div className="db-lead-head">
              <p className="db-lead-eyebrow">最紧要</p>
              <span className="db-lead-due" data-overdue={dueLabel(lead.due).overdue}>
                {dueLabel(lead.due).text}
              </span>
            </div>
            <p className="db-lead-title">
              {lead.course} · {lead.title}
            </p>
            <p className="db-lead-num">
              剩 <b>{leadLeft}</b> 人
            </p>
            <div className="db-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <p className="db-lead-meta">
              {leadPaid}/{lead.total} 已交
            </p>
            <button
              type="button"
              className="db-primary"
              onClick={() => onOpen(lead.id)}
            >
              去点名
            </button>
          </section>
        ) : (
          <section className="db-lead db-lead--empty">
            <p className="db-empty-title">没有要收的作业</p>
            <button type="button" className="db-ghost" onClick={onAll}>
              新建清点
            </button>
          </section>
        )}

        <section className="db-block">
          <div className="db-block-head">
            <p className="db-block-title">近期清点</p>
            <button type="button" className="db-link" onClick={onAll}>
              全部
            </button>
          </div>
          {running.length === 0 && <p className="db-empty">暂无</p>}
          <ul className="db-list">
            {running.slice(0, 4).map((a) => {
              const paid = paidCounts[a.id] ?? 0
              const left = Math.max(0, a.total - paid)
              const due = dueLabel(a.due)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className="db-row"
                    onClick={() => onOpen(a.id)}
                  >
                    <span className="db-row-main">
                      <span className="db-row-title">
                        {a.course} · {a.title}
                      </span>
                      <span className="db-row-meta" data-overdue={due.overdue}>
                        {due.text} · {paid}/{a.total}
                      </span>
                    </span>
                    <span className="db-row-left">{left === 0 ? '齐' : left}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="db-block">
          <div className="db-block-head">
            <p className="db-block-title">最近标记</p>
          </div>
          {data.marks.length === 0 && <p className="db-empty">还没有记录</p>}
          <ul className="db-list db-list--plain">
            {data.marks.map((m, i) => (
              <li key={`${m.studentName}-${m.at}-${i}`} className="db-mark">
                <span className="db-mark-name">{m.studentName}</span>
                <span className="db-mark-what">
                  {m.course} · {m.title}
                </span>
                <span className="db-mark-time">{clockText(m.at)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="db-block">
          <div className="db-block-head">
            <p className="db-block-title">资料</p>
            <button type="button" className="db-link" onClick={onLibrary}>
              打开
            </button>
          </div>
          <p className="db-muted">
            {data.publishCount} 个已发布包 · {data.materialCount} 个文件
          </p>
        </section>
      </div>
    </main>
  )
}
