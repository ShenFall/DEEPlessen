import { useState } from 'react'
import type { Assignment } from '../db'
import { dueLabel } from '../lib/due'
import './sheet.css'

type Props = {
  assignment: Assignment
  paid: number
  onClose: () => void
  onGo: (id: string) => void
  onToggleStatus: (id: string, closed: boolean) => void
  onClone: (id: string) => void
  onDelete: (id: string) => void
}

/** 作业详情：与待办详情同一套弹层，不做整页跳转 */
export default function AssignmentSheet({
  assignment,
  paid,
  onClose,
  onGo,
  onToggleStatus,
  onClone,
  onDelete,
}: Props) {
  const [armed, setArmed] = useState(false)
  const closed = assignment.status === 'closed'
  const left = Math.max(0, assignment.total - paid)
  const due = dueLabel(assignment.due)

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="sheet-title">
            {assignment.course} · {assignment.title}
          </p>
          <button type="button" className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="sheet-facts">
          <span>{closed ? '已结束' : '进行中'}</span>
          <span data-overdue={due.overdue}>{due.text} 截止</span>
          <span>
            已收 {paid} / {assignment.total}
          </span>
          <span>{left === 0 ? '齐了' : `剩 ${left}`}</span>
        </div>

        <div className="sheet-actions">
          <button
            type="button"
            className="sheet-main"
            onClick={() => {
              onGo(assignment.id)
              onClose()
            }}
          >
            去点名
          </button>
          <button
            type="button"
            className="sheet-sub"
            onClick={() => onToggleStatus(assignment.id, !closed)}
          >
            {closed ? '恢复' : '结束'}
          </button>
        </div>

        <div className="sheet-actions">
          <button
            type="button"
            className="sheet-sub"
            onClick={() => onClone(assignment.id)}
          >
            复制为新的
          </button>
          <button
            type="button"
            className="sheet-danger"
            onClick={() => {
              if (!armed) {
                setArmed(true)
                window.setTimeout(() => setArmed(false), 3000)
                return
              }
              onDelete(assignment.id)
              onClose()
            }}
          >
            {armed ? '再点一次删除' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
