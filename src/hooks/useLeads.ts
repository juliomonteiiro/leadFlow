import { useCallback, useEffect, useState } from 'react'
import { supabase }                          from '@/lib/supabase'
import { useWorkspace }                      from '@/hooks/useWorkspace'
import type { Lead }                         from '@/lib/types'

type CreateLeadData = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'workspace_id'>
const LEADS_UPDATED_EVENT = 'leadflow:leads-updated'

function emitLeadsUpdated(): void {
  window.dispatchEvent(new Event(LEADS_UPDATED_EVENT))
}

export function useLeads() {
  const { workspace }         = useWorkspace()
  const [leads, setLeads]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    supabase.from('leads').select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data ?? []); setLoading(false) })
  }, [workspace, tick])

  useEffect(() => {
    function handleLeadsUpdated() {
      setTick((n) => n + 1)
    }

    window.addEventListener(LEADS_UPDATED_EVENT, handleLeadsUpdated)
    return () => window.removeEventListener(LEADS_UPDATED_EVENT, handleLeadsUpdated)
  }, [])

  const updateStage = useCallback(async (leadId: string, stageId: string): Promise<void> => {
    await supabase.from('leads').update({ stage_id: stageId }).eq('id', leadId)
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage_id: stageId } : l)))
    emitLeadsUpdated()
  }, [])

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>): Promise<Lead | null> => {
    const { data: updated } = await supabase.from('leads').update(data).eq('id', leadId).select().single()
    if (updated) setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
    emitLeadsUpdated()
    return updated
  }, [])

  const createLead = useCallback(async (data: CreateLeadData): Promise<Lead | null> => {
    if (!workspace) return null
    const payload = {
      workspace_id: workspace.id,
      stage_id: data.stage_id,
      assigned_to: data.assigned_to ?? null,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      company: data.company.trim(),
      job_title: data.job_title.trim(),
      source: data.source.trim(),
      notes: data.notes.trim(),
    }
    const { data: created, error } = await supabase.from('leads').insert(payload).select().single()
    if (error) {
      console.error('Erro ao criar lead', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return null
    }
    if (created) {
      setLeads((prev) => [created, ...prev])
      emitLeadsUpdated()
    }
    return created
  }, [workspace])

  return { leads, loading, refetch: () => setTick((n) => n + 1), updateStage, updateLead, createLead }
}
