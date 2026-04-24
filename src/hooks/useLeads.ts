import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import type { Lead, LeadCustomValue } from '@/lib/types'

export function useLeads() {
  const { workspace } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    if (!workspace) {
      setLeads([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    setLeads((data as Lead[]) ?? [])
    setLoading(false)
  }, [workspace])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single()
    if (data) {
      setLeads((prev) => [data as Lead, ...prev])
      await logActivity('lead_created', lead.workspace_id, (data as Lead).id, { name: lead.name })
    }
    return data as Lead | null
  }

  async function updateLead(id: string, updates: Partial<Lead>) {
    await supabase.from('leads').update(updates).eq('id', id)
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }

  async function deleteLead(id: string) {
    await supabase.from('leads').delete().eq('id', id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  async function updateLeadStage(leadId: string, newStageId: string) {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return

    await supabase
      .from('leads')
      .update({ stage_id: newStageId })
      .eq('id', leadId)

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage_id: newStageId } : l))
    )

    await logActivity('stage_changed', lead.workspace_id, leadId, {
      from: lead.stage_id,
      to: newStageId,
    })
  }

  async function getCustomValues(leadId: string): Promise<LeadCustomValue[]> {
    const { data } = await supabase
      .from('lead_custom_values')
      .select('*')
      .eq('lead_id', leadId)
    return (data as LeadCustomValue[]) ?? []
  }

  async function setCustomValue(leadId: string, fieldId: string, value: string) {
    await supabase
      .from('lead_custom_values')
      .upsert({ lead_id: leadId, field_id: fieldId, value }, { onConflict: 'lead_id,field_id' })
  }

  return { leads, loading, createLead, updateLead, deleteLead, updateLeadStage, getCustomValues, setCustomValue, refreshLeads: fetchLeads }
}

async function logActivity(type: string, workspaceId: string, leadId: string, metadata: Record<string, unknown>) {
  await supabase.from('activity_logs').insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    activity_type: type,
    metadata,
  })
}
