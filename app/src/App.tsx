import { useCallback, useEffect, useState } from 'react'
import {
  cloneAssignment,
  createAssignment,
  listAssignments,
  loadWorkspace,
  paidCounts,
  setAssignmentStatus,
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

  const bootstrap = useCallback(async (id?: string) => {
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
    const id = await createAssignment(input)
    await bootstrap(id)
    setView('reconcile')
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

  if (view === 'import') {
    return (
      <ImportScreen
        onCancel={() => setView(ws ? 'reconcile' : 'list')}
        onDone={() => {
          void bootstrap(ws?.assignment.id).finally(() => setView('reconcile'))
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
        onImportRoster={() => setView('import')}
      />
    )
  }

  return (
    <ReconcileScreen
      students={ws.students}
      assignment={ws.assignment}
      initialPaid={ws.paid}
      onBack={() => setView('list')}
      onOpenImport={() => setView('import')}
      onToggleStatus={() => void toggleStatus()}
      onClone={() => void cloneCurrent()}
    />
  )
}
