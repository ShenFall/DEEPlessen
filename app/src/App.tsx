import { useEffect, useState } from 'react'
import { loadWorkspace, type Workspace } from './db'
import ReconcileScreen from './features/reconcile/ReconcileScreen'

export default function App() {
  const [ws, setWs] = useState<Workspace | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadWorkspace()
      .then((data) => {
        if (alive) setWs(data)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [])

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

  return (
    <ReconcileScreen
      students={ws.students}
      assignment={ws.assignment}
      initialPaid={ws.paid}
    />
  )
}
