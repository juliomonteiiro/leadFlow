import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import { useWorkspace }        from '@/hooks/useWorkspace'
import type { FunnelStage }    from '@/lib/types'

export function useStages() {
  const { workspace }         = useWorkspace()
  const [stages, setStages]   = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    supabase.from('funnel_stages').select('*')
      .eq('workspace_id', workspace.id).order('position')
      .then(({ data }) => { setStages(data ?? []); setLoading(false) })
  }, [workspace, tick])

  return { stages, loading, refetch: () => setTick((n) => n + 1) }
}
