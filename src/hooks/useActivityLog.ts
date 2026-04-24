import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import type { ActivityLog } from '@/lib/types'

export function useActivityLog(leadId?: string | null) {
  const { workspace } = useWorkspace()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!workspace) {
      setLogs([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data } = await query
    setLogs((data as ActivityLog[]) ?? [])
    setLoading(false)
  }, [workspace, leadId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, loading, refreshLogs: fetchLogs }
}
