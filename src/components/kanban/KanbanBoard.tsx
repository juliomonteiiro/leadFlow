import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { Lead } from '@/lib/types'
import { useLeads } from '@/hooks/useLeads'
import { useStages } from '@/hooks/useStages'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import { EDGE_FN_GENERATE_MESSAGES } from '@/lib/constants'
import { KanbanColumn } from './KanbanColumn'
import { LeadCard } from './LeadCard'

interface KanbanBoardProps {
  onLeadClick: (lead: Lead) => void
  onAddLead: (stageId: string) => void
}

export function KanbanBoard({ onLeadClick, onAddLead }: KanbanBoardProps) {
  const { leads, updateLeadStage } = useLeads()
  const { stages } = useStages()
  const { campaigns } = useCampaigns()
  const { showToast } = useToast()
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getLeadsByStage = useCallback(
    (stageId: string) => leads.filter((l) => l.stage_id === stageId),
    [leads]
  )

  function getCurrentStageId(leadId: string): string | null {
    return leads.find((l) => l.id === leadId)?.stage_id ?? null
  }

  async function checkRequiredFields(leadId: string, _stageId: string): Promise<string[]> {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return []

    const { data: requiredFields } = await supabase
      .from('stage_required_fields')
      .select('standard_field, custom_field_id')
      .eq('stage_id', _stageId)

    const missing: string[] = []
    for (const req of requiredFields ?? []) {
      if (req.standard_field) {
        const value = lead[req.standard_field as keyof Lead]
        if (!value || value === '') {
          missing.push(req.standard_field)
        }
      }
    }
    return missing
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveLead(null)

    if (!over || active.id === over.id) return

    const leadId = String(active.id)
    const newStageId = String(over.id)
    const oldStageId = getCurrentStageId(leadId)

    if (!oldStageId || oldStageId === newStageId) return

    const missingFields = await checkRequiredFields(leadId, newStageId)
    if (missingFields.length > 0) {
      showToast(`Campos obrigatorios faltando: ${missingFields.join(', ')}`, 'error')
      return
    }

    await updateLeadStage(leadId, newStageId)
    triggerCampaignMessages(leadId, newStageId)
  }

  function triggerCampaignMessages(leadId: string, stageId: string): void {
    const matchingCampaigns = campaigns.filter(
      (c) => c.trigger_stage_id === stageId && c.is_active
    )
    for (const campaign of matchingCampaigns) {
      supabase.functions.invoke(EDGE_FN_GENERATE_MESSAGES, {
        body: { lead_id: leadId, campaign_id: campaign.id, auto_generated: true },
      })
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === String(event.active.id))
    setActiveLead(lead ?? null)
  }

  const sortedStages = [...stages].sort((a, b) => a.position - b.position)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {sortedStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={getLeadsByStage(stage.id)}
            onLeadClick={onLeadClick}
            onAddLead={onAddLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="opacity-90">
            <LeadCard lead={activeLead} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
