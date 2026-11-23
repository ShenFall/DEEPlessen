import { useCallback, useEffect, useState } from 'react'
import {
  cloneAssignment,
  createAssignment,
  createTodo,
  deleteAssignment,
  deleteTodo,
  ensureSeed,
  listAssignments,
  loadDashboard,
  loadWorkspace,
  paidCounts,
  setAssignmentStatus,
  setTodoDone,
  setTodoDue,
  syncAssignmentTotals,
  updateAssignment,
  type Assignment,
  type DashboardData,
  type Workspace,
} from './db'
import AssignmentListScreen from './features/assignments/AssignmentListScreen'
import DashboardScreen from './features/dashboard/DashboardScreen'
import ImportScreen from './features/import/ImportScreen'
import LibraryScreen from './features/library/LibraryScreen'
import ReconcileScreen from './features/reconcile/ReconcileScreen'

type View = 'dashboard' | 'reconcile' | 'list' | 'import' | 'library'

export default function App() {
  const [ws, setWs] = useState<Workspace | null>(null)
  const [list, setList] = useState<Assignment[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [view, setView] = useState<View>('dashboard')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 从哪个界面进的导入页，回来就回哪 */
  const [returnTo, setReturnTo] = useState<View>('reconcile')
  /** 从今天看板还是从清点列表进的对账台，← 就回哪 */
  const [backTo, setBackTo] = useState<View>('dashboard')

  const bootstrap = useCallback(async (id?: string) => {
    await ensureSeed()
    await syncAssignmentTotals()
    const [workspace, assignments, paid, dashboard] = await Promise.all([
      loadWorkspace(id),
      listAssignments(),
      paidCounts(),
      loadDashboard(),
    ])
    setWs(workspace)
    setList(assignments)
    setCounts(paid)
    setDash(dashboard)
    setReady(true)
    return workspace
  }, [])

  useEffect(() => {
    bootstrap().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    )
  }, [bootstrap])

  async function open(id: string) {
    setBackTo(view === 'list' ? 'list' : 'dashboard')
    const workspace = await bootstrap(id)
    if (workspace) setView('reconcile')
  }

  async function create(input: { course: string; title: string; due: string }) {
    await createAssignment(input)
    // 建完留在列表，别把人拽进对账台
    await bootstrap()
  }

  async function update(id: string, input: { course: string; title: string; due: string }) {
    await updateAssignment(id, input)
    await bootstrap(ws?.assignment.id ?? id)
  }

  async function remove(id: string) {
    await deleteAssignment(id)
    await bootstrap()
  }

  async function addTodo(title: string, due?: string) {
    await createTodo(title, due)
    await bootstrap()
  }

  async function toggleTodo(id: string, done: boolean) {
    await setTodoDone(id, done)
    await bootstrap()
  }

  async function removeTodo(id: string) {
    await deleteTodo(id)
    await bootstrap()
  }

  async function setTodoDate(id: string, due?: string) {
    await setTodoDue(id, due)
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

  if (view === 'library') {
    return <LibraryScreen onBack={() => setView('dashboard')} />
  }

  if (view === 'dashboard' && dash) {
    return (
      <DashboardScreen
        data={dash}
        paidCounts={counts}
        onOpen={(id) => void open(id)}
        onAll={() => setView('list')}
        onLibrary={() => setView('library')}
        onAddTodo={(title, due) => void addTodo(title, due)}
        onToggleTodo={(id, done) => void toggleTodo(id, done)}
        onDeleteTodo={(id) => void removeTodo(id)}
        onSetTodoDue={(id, due) => void setTodoDate(id, due)}
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
        onUpdate={(id, input) => void update(id, input)}
        onDelete={(id) => void remove(id)}
        onImportRoster={() => openImport('list')}
        onToday={() => setView('dashboard')}
      />
    )
  }

  return (
    <ReconcileScreen
      students={ws.students}
      assignment={ws.assignment}
      initialPaid={ws.paid}
      onBack={() => setView(backTo)}
      onOpenImport={() => openImport('reconcile')}
      onToggleStatus={() => void toggleStatus()}
      onClone={() => void cloneCurrent()}
    />
  )
}
