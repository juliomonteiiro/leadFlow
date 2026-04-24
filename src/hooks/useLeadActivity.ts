import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import type { ActivityLog }    from '@/lib/types'

export function useLeadActivity(leadId: string) {
  const [logs, setLogs]       = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    setLoading(true)
    supabase.from('activity_logs').select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [leadId, tick])

  return { logs, loading, refetch: () => setTick((n) => n + 1) }
}
