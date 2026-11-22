import { useCallback, useEffect, useState } from 'react'
import { loadWorkspace, type Workspace } from './db'
import ImportScreen from './features/import/ImportScreen'
import ReconcileScreen from './features/reconcile/ReconcileScreen'

type View = 'reconcile' | 'import'

export default function App() {
  const [ws, setWs] = useState<Workspace | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('reconcile')

  const refresh = useCallback(async () => {
    const data = await loadWorkspace()
    setWs(data)
  }, [])

  useEffect(() => {
    let alive = true
    refresh().catch((e: unknown) => {
      if (alive) setError(e instanceof Error ? e.message : String(e))
    })
    return () => {
      alive = false
    }
  }, [refresh])

  if (error) {
    return (
      <main className="boot">
        <p className="boot-line">载入失败</p>
        <p className="boot-sub">{error}</p>
      </main>
    )
  }

  if (!ws) {
    return (
      <main className="boot">
        <p className="boot-line">deep:~$ 载入…</p>
      </main>
    )
  }

  if (view === 'import') {
    return (
      <ImportScreen
        onCancel={() => setView('reconcile')}
        onDone={() => {
          void refresh().finally(() => setView('reconcile'))
        }}
      />
    )
  }

  return (
    <ReconcileScreen
      students={ws.students}
      assignment={ws.assignment}
      initialPaid={ws.paid}
      onOpenImport={() => setView('import')}
    />
  )
}
