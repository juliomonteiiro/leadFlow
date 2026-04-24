import { useCallback, useEffect, useState } from 'react'
import { supabase }                          from '@/lib/supabase'
import { useWorkspace }                      from '@/contexts/WorkspaceContext'
import type { Campaign }                     from '@/lib/types'

type CreateCampaignData = Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'workspace_id'>

export function useCampaigns() {
  const { workspace }             = useWorkspace()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [tick, setTick]           = useState(0)

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    supabase.from('campaigns').select('*').eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCampaigns(data ?? []); setLoading(false) })
  }, [workspace, tick])

  const create = useCallback(async (data: CreateCampaignData): Promise<Campaign | null> => {
    if (!workspace) return null
    const { data: created } = await supabase.from('campaigns').insert({ ...data, workspace_id: workspace.id }).select().single()
    if (created) setCampaigns((prev) => [created, ...prev])
    return created
  }, [workspace])

  const update = useCallback(async (id: string, data: Partial<Campaign>): Promise<void> => {
    await supabase.from('campaigns').update(data).eq('id', id)
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { campaigns, loading, refetch: () => setTick((n) => n + 1), create, update, remove }
}
