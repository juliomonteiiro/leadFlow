import { useCallback, useEffect, useState } from 'react'
import { supabase }          from '@/lib/supabase'
import { useWorkspace }      from '@/hooks/useWorkspace'
import type { ActivityLog, ActivityType } from '@/lib/types'

interface LogParams {
  leadId:       string
  activityType: ActivityType
  metadata?:    Record<string, unknown>
}

export function useActivityLog(leadId?: string | null) {
  const { workspace, user } = useWorkspace()
  const [logs, setLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (!workspace) {
      setLogs([])
      return
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (leadId) query = query.eq('lead_id', leadId)

    query.then(({ data }) => {
      setLogs((data as ActivityLog[]) ?? [])
    })
  }, [workspace, leadId])

  const log = useCallback(async ({ leadId, activityType, metadata = {} }: LogParams): Promise<void> => {
    if (!workspace || !user) return
    await supabase.from('activity_logs').insert({
      workspace_id: workspace.id, lead_id: leadId,
      user_id: user.id, activity_type: activityType, metadata,
    })
    setLogs((prev) => ([
      {
        id: `temp-${Date.now()}`,
        workspace_id: workspace.id,
        lead_id: leadId,
        user_id: user.id,
        activity_type: activityType,
        metadata,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]))
  }, [workspace, user])
  return { log, logs }
}
