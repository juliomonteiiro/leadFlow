import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import { useWorkspace }        from '@/contexts/WorkspaceContext'
import type { FunnelStage }    from '@/lib/types'

interface StageMetric { stage: FunnelStage; count: number }

export function useDashboardMetrics() {
  const { workspace }                       = useWorkspace()
  const [totalLeads, setTotalLeads]         = useState(0)
  const [totalGenerated, setTotalGenerated] = useState(0)
  const [totalSent, setTotalSent]           = useState(0)
  const [byStage, setByStage]               = useState<StageMetric[]>([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!workspace) return
    async function fetchMetrics() {
      setLoading(true)
      const wid = workspace.id
      const { data: leadIds } = await supabase.from('leads').select('id').eq('workspace_id', wid)
      const ids = (leadIds ?? []).map((l) => l.id)

      const [leadsRes, stagesRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', wid),
        supabase.from('funnel_stages').select('*').eq('workspace_id', wid).order('position'),
      ])

      const genRes  = ids.length > 0 ? await supabase.from('generated_messages').select('id', { count: 'exact', head: true }).in('lead_id', ids) : { count: 0 }
      const sentRes = ids.length > 0 ? await supabase.from('generated_messages').select('id', { count: 'exact', head: true }).in('lead_id', ids).eq('was_sent', true) : { count: 0 }

      const stages = stagesRes.data ?? []
      const leadsPerStage = await Promise.all(
        stages.map(async (stage) => {
          const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('stage_id', stage.id)
          return { stage, count: count ?? 0 }
        })
      )

      setTotalLeads(leadsRes.count ?? 0)
      setTotalGenerated(genRes.count ?? 0)
      setTotalSent(sentRes.count ?? 0)
      setByStage(leadsPerStage)
      setLoading(false)
    }
    fetchMetrics()
  }, [workspace])

  return { totalLeads, totalGenerated, totalSent, byStage, loading }
}
