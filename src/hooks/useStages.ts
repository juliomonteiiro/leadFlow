import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import type { FunnelStage } from '@/lib/types'

export function useStages() {
  const { workspace } = useWorkspace()
  const [stages, setStages] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStages = useCallback(async () => {
    if (!workspace) {
      setStages([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('position')

    setStages((data as FunnelStage[]) ?? [])
    setLoading(false)
  }, [workspace])

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  async function createStage(name: string, color: string, position: number) {
    if (!workspace) return
    const { data } = await supabase
      .from('funnel_stages')
      .insert({ workspace_id: workspace.id, name, color, position })
      .select()
      .single()
    if (data) {
      setStages((prev) => [...prev, data as FunnelStage].sort((a, b) => a.position - b.position))
    }
  }

  async function updateStage(id: string, updates: Partial<FunnelStage>) {
    await supabase.from('funnel_stages').update(updates).eq('id', id)
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  async function deleteStage(id: string) {
    await supabase.from('funnel_stages').delete().eq('id', id)
    setStages((prev) => prev.filter((s) => s.id !== id))
  }

  return { stages, loading, createStage, updateStage, deleteStage, refreshStages: fetchStages }
}
