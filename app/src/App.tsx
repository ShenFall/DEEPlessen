import { useCallback, useEffect, useState } from 'react'
import {
  cloneAssignment,
  createAssignment,
  ensureSeed,
  listAssignments,
  loadWorkspace,
  paidCounts,
  setAssignmentStatus,
  syncAssignmentTotals,
  type Assignment,
  type Workspace,
} from './db'
import AssignmentListScreen from './features/assignments/AssignmentListScreen'
import ImportScreen from './features/import/ImportScreen'
import ReconcileScreen from './features/reconcile/ReconcileScreen'

type View = 'reconcile' | 'list' | 'import'

export default function App() {
  const [ws, setWs] = useState<Workspace | null>(null)
  const [list, setList] = useState<Assignment[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [view, setView] = useState<View>('reconcile')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 从哪个界面进的导入页，回来就回哪 */
  const [returnTo, setReturnTo] = useState<View>('reconcile')

  const bootstrap = useCallback(async (id?: string) => {
    await ensureSeed()
    await syncAssignmentTotals()
    const [workspace, assignments, paid] = await Promise.all([
      loadWorkspace(id),
      listAssignments(),
      paidCounts(),
    ])
    setWs(workspace)
    setList(assignments)
    setCounts(paid)
    setReady(true)
    return workspace
  }, [])

  useEffect(() => {
    bootstrap().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    )
  }, [bootstrap])

  async function open(id: string) {
    const workspace = await bootstrap(id)
    if (workspace) setView('reconcile')
  }

  async function create(input: { course: string; title: string; due: string }) {
    await createAssignment(input)
    // 建完留在列表，别把人拽进对账台
    await bootstrap()
  }

  async function toggleStatus() {
    if (!ws) return
    const next = ws.assignment.status === 'closed' ? 'reconciling' : 'closed'
    await setAssignmentStatus(ws.assignment.id, next)
    await bootstrap(ws.assignment.id)
  }

  async function cloneCurrent() {
    if (!ws) return
    const id = await cloneAssignment(ws.assignment.id)
    if (!id) return
    await bootstrap(id)
    setView('reconcile')
  }

  if (error) {
    return (
      <main className="boot">
        <p className="boot-line">载入失败</p>
        <p className="boot-sub">{error}</p>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="boot">
        <p className="boot-line">deep:~$ 载入…</p>
      </main>
    )
  }

  function openImport(from: View) {
    setReturnTo(from)
    setView('import')
  }

  if (view === 'import') {
    const back = () => setView(ws ? returnTo : 'list')
    return (
      <ImportScreen
        onCancel={back}
        onDone={() => {
          void bootstrap(ws?.assignment.id).finally(back)
        }}
      />
    )
  }

  if (view === 'list' || !ws) {
    return (
      <AssignmentListScreen
        assignments={list}
        paidCounts={counts}
        onOpen={(id) => void open(id)}
        onCreate={(input) => void create(input)}
        onImportRoster={() => openImport('list')}
      />
    )
  }

  return (
    <ReconcileScreen
      students={ws.students}
      assignment={ws.assignment}
      initialPaid={ws.paid}
      onBack={() => setView('list')}
      onOpenImport={() => openImport('reconcile')}
      onToggleStatus={() => void toggleStatus()}
      onClone={() => void cloneCurrent()}
    />
  )
}
