import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Lead, FunnelStage } from '@/lib/types'
import { LeadCard } from './LeadCard'

interface KanbanColumnProps {
  stage: FunnelStage
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stageId: string) => void
}

export function KanbanColumn({ stage, leads, onLeadClick, onAddLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'stage' },
  })

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-[280px]">
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold text-text-primary">{stage.name}</h3>
          <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddLead(stage.id)}
          className="text-text-muted hover:text-brand transition-colors p-1 rounded-btn hover:bg-surface-hover"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 rounded-card min-h-[200px] transition-colors ${
          isOver ? 'bg-brand/5 border-2 border-dashed border-brand/30' : 'bg-surface-base/50'
        }`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-xs text-text-muted">
            Nenhum lead nesta etapa
          </div>
        )}
      </div>
    </div>
  )
}
