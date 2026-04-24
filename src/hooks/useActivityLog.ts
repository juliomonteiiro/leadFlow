import { useCallback }       from 'react'
import { supabase }          from '@/lib/supabase'
import { useWorkspace }      from '@/contexts/WorkspaceContext'
import type { ActivityType } from '@/lib/types'

interface LogParams {
  leadId:       string
  activityType: ActivityType
  metadata?:    Record<string, unknown>
}

export function useActivityLog() {
  const { workspace, user } = useWorkspace()
  const log = useCallback(async ({ leadId, activityType, metadata = {} }: LogParams): Promise<void> => {
    if (!workspace || !user) return
    await supabase.from('activity_logs').insert({
      workspace_id: workspace.id, lead_id: leadId,
      user_id: user.id, activity_type: activityType, metadata,
    })
  }, [workspace, user])
  return { log }
}
