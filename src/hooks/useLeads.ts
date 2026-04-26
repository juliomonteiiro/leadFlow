import { useCallback, useEffect, useState } from 'react'
import { supabase }                          from '@/lib/supabase'
import { useWorkspace }                      from '@/hooks/useWorkspace'
import type { Lead }                         from '@/lib/types'

type CreateLeadData = {
  stage_id: string
  assigned_to: string | null
  name: string
  email: string
  phone: string
  company: string
  job_title: string
  source: string
  notes: string
}
const LEADS_UPDATED_EVENT = 'leadflow:leads-updated'

function emitLeadsUpdated(): void {
  window.dispatchEvent(new Event(LEADS_UPDATED_EVENT))
}

function sortLeadsList(list: Lead[]): Lead[] {
  return [...list].sort((a, b) => {
    const ao = a.sort_order
    const bo = b.sort_order
    const aNull = ao == null
    const bNull = bo == null
    if (aNull && bNull) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (aNull) return 1
    if (bNull) return -1
    if (ao !== bo) return ao - bo
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
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
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(sortLeadsList(data ?? [])); setLoading(false) })
  }, [workspace, tick])

  useEffect(() => {
    function handleLeadsUpdated() {
      setTick((n) => n + 1)
    }

    window.addEventListener(LEADS_UPDATED_EVENT, handleLeadsUpdated)
    return () => window.removeEventListener(LEADS_UPDATED_EVENT, handleLeadsUpdated)
  }, [])

  const updateStage = useCallback(async (leadId: string, stageId: string, sortOrder?: number): Promise<boolean> => {
    const payload: { stage_id: string; sort_order?: number } = { stage_id: stageId }
    if (typeof sortOrder === 'number') payload.sort_order = sortOrder
    const { error } = await supabase.from('leads').update(payload).eq('id', leadId)
    if (error) {
      console.error('Erro ao atualizar etapa do lead', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        leadId,
        stageId,
        sortOrder,
      })
      return false
    }
    setLeads((prev) => sortLeadsList(prev.map((l) => (l.id === leadId ? { ...l, ...payload } : l))))
    emitLeadsUpdated()
    return true
  }, [])

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>): Promise<Lead | null> => {
    const { data: updated } = await supabase.from('leads').update(data).eq('id', leadId).select().single()
    if (updated) setLeads((prev) => sortLeadsList(prev.map((l) => (l.id === leadId ? updated : l))))
    emitLeadsUpdated()
    return updated
  }, [])

  const createLead = useCallback(async (data: CreateLeadData): Promise<Lead | null> => {
    if (!workspace) return null
    const payload = {
      workspace_id: workspace.id,
      stage_id: data.stage_id,
      sort_order: Date.now(),
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
      setLeads((prev) => sortLeadsList([created, ...prev]))
      emitLeadsUpdated()
    }
    return created
  }, [workspace])

  return { leads, loading, refetch: () => setTick((n) => n + 1), updateStage, updateLead, createLead }
}
