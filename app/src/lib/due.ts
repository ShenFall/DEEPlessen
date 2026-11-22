export type DueLabel = { text: string; overdue: boolean }

/** 今天 / 明天 / 已逾期，比 "11/22 23:59" 更快读懂 */
export function dueLabel(iso: string): DueLabel {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { text: '时间未知', overdue: false }

  const now = new Date()
  const time = d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  if (d.getTime() < now.getTime()) return { text: `已逾期 · ${time}`, overdue: true }

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  if (d.toDateString() === now.toDateString())
    return { text: `今天 ${time}`, overdue: false }
  if (d.toDateString() === tomorrow.toDateString())
    return { text: `明天 ${time}`, overdue: false }

  return { text: `${d.getMonth() + 1}/${d.getDate()} ${time}`, overdue: false }
}
