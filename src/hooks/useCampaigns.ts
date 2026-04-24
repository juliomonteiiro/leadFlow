import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import type { Campaign } from '@/lib/types'

export function useCampaigns() {
  const { workspace } = useWorkspace()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    if (!workspace) {
      setCampaigns([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    setCampaigns((data as Campaign[]) ?? [])
    setLoading(false)
  }, [workspace])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) {
    const { data } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()
    if (data) {
      setCampaigns((prev) => [data as Campaign, ...prev])
    }
    return data as Campaign | null
  }

  async function updateCampaign(id: string, updates: Partial<Campaign>) {
    await supabase.from('campaigns').update(updates).eq('id', id)
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  async function deleteCampaign(id: string) {
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return { campaigns, loading, createCampaign, updateCampaign, deleteCampaign, refreshCampaigns: fetchCampaigns }
}
