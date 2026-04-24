import { useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0 })

  async function triggerCampaignMessages(leadId: string, stageId: string): Promise<void> {
    const targets = campaigns.filter((c) => c.trigger_stage_id === stageId && c.is_active)
    await Promise.allSettled(targets.map((campaign) =>
      supabase.functions.invoke(EDGE_FN_GENERATE_MESSAGES, {
        body: { lead_id: leadId, campaign_id: campaign.id, auto_generated: true },
      })
    ))
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
      const labels = missingFields.map((field) => field.label).join(', ')
      showToast(`Preencha os campos obrigatórios: ${labels}`, 'error')
      return
    }
    const oldStageId = lead.stage_id
    await updateStage(leadId, newStageId)
    await log({ leadId, activityType: 'stage_changed', metadata: { from: oldStageId, to: newStageId } })
    await triggerCampaignMessages(leadId, newStageId)
  }

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]')
    const isLeadCard = target.closest('[data-kanban-card]')
    if (isInteractive || isLeadCard || !containerRef.current) return

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: containerRef.current.scrollLeft,
    }
    containerRef.current.style.cursor = 'grabbing'
    containerRef.current.style.userSelect = 'none'
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || !containerRef.current) return
    const deltaX = event.clientX - dragStateRef.current.startX
    containerRef.current.scrollLeft = dragStateRef.current.startScrollLeft - deltaX
  }

  function stopDragging() {
    if (!containerRef.current) return
    dragStateRef.current.active = false
    containerRef.current.style.cursor = 'grab'
    containerRef.current.style.userSelect = ''
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
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-4 cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
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
