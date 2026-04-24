import { useEffect, useState } from 'react'
import type { User }      from '@supabase/supabase-js'
import { supabase }       from '@/lib/supabase'
import type { Workspace } from '@/lib/types'
import { WorkspaceContext } from '@/contexts/workspace.context'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [user, setUser]           = useState<User | null>(null)
  const [loading, setLoading]     = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [tick, setTick]           = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authReady) return

    if (!user) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase.rpc('fn_my_workspace_ids').then(async ({ data: workspaceIds, error: idsError }) => {
      if (idsError || !workspaceIds || workspaceIds.length === 0) {
        setWorkspace(null)
        setLoading(false)
        return
      }

      const { data: rows, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, created_at')
        .in('id', workspaceIds)
        .limit(1)

      if (workspaceError || !rows || rows.length === 0) {
        setWorkspace({
          id: workspaceIds[0] as string,
          name: 'Meu workspace',
          created_at: new Date().toISOString(),
        })
        setLoading(false)
        return
      }

      setWorkspace(rows[0] as Workspace)
      setLoading(false)
    })
  }, [authReady, user, tick])

  function refetch() {
    setTick((n) => n + 1)
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, user, loading, refetch }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
