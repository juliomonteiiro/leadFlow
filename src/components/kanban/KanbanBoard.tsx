import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { KanbanColumn }      from '@/components/kanban/KanbanColumn'
import { useStages }         from '@/hooks/useStages'
import { useLeads }          from '@/hooks/useLeads'
import { useRequiredFields } from '@/hooks/useRequiredFields'
import { useActivityLog }    from '@/hooks/useActivityLog'
import { useCampaigns }      from '@/hooks/useCampaigns'
import { useToast }          from '@/contexts/ToastContext'
import { supabase }          from '@/lib/supabase'
import { EDGE_FN_GENERATE_MESSAGES } from '@/lib/constants'
import type { Lead }         from '@/lib/types'

export function KanbanBoard({ onLeadClick, onCreateClick }: { onLeadClick: (lead: Lead) => void; onCreateClick: () => void }) {
  const { stages, loading: stagesLoading }            = useStages()
  const { leads, loading: leadsLoading, updateStage } = useLeads()
  const { checkRequiredFields }                       = useRequiredFields()
  const { log }                                       = useActivityLog()
  const { campaigns }                                 = useCampaigns()
  const { showToast }                                 = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function triggerCampaignMessages(leadId: string, stageId: string): void {
    campaigns.filter((c) => c.trigger_stage_id === stageId && c.is_active).forEach((campaign) => {
      supabase.functions.invoke(EDGE_FN_GENERATE_MESSAGES, {
        body: { lead_id: leadId, campaign_id: campaign.id, auto_generated: true },
      })
    })
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event
    if (!over) return
    const leadId     = String(active.id)
    const newStageId = String(over.id)
    const lead       = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage_id === newStageId) return
    const missingFields = await checkRequiredFields(lead, newStageId)
    if (missingFields.length > 0) {
      showToast(`Campos obrigatórios: ${missingFields.map((f) => f.label).join(', ')}`, 'error')
      return
    }
    const oldStageId = lead.stage_id
    await updateStage(leadId, newStageId)
    await log({ leadId, activityType: 'stage_changed', metadata: { from: oldStageId, to: newStageId } })
    triggerCampaignMessages(leadId, newStageId)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Kanban</h1>
        <button onClick={onCreateClick} className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          + Novo lead
        </button>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage}
              leads={leads.filter((l) => l.stage_id === stage.id)}
              loading={stagesLoading || leadsLoading} onLeadClick={onLeadClick} />
          ))}
        </div>
      </DndContext>
    </>
  )
}
