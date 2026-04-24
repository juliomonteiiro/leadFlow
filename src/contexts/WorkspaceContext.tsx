import { createContext, useContext, useEffect, useState } from 'react'
import type { User }      from '@supabase/supabase-js'
import { supabase }       from '@/lib/supabase'
import type { Workspace } from '@/lib/types'

interface WorkspaceContextValue {
  workspace: Workspace | null
  user:      User | null
  loading:   boolean
  refetch:   () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [user, setUser]           = useState<User | null>(null)
  const [loading, setLoading]     = useState(true)
  const [tick, setTick]           = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('workspace_members')
      .select('workspaces(id, name, created_at)')
      .eq('user_id', user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        const raw = data?.workspaces
        setWorkspace(raw && !Array.isArray(raw) ? (raw as Workspace) : null)
        setLoading(false)
      })
  }, [user, tick])

  function refetch() {
    setTick((n) => n + 1)
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, user, loading, refetch }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
