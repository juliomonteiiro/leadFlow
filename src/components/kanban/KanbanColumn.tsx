import { useDroppable }  from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LeadCard }      from '@/components/kanban/LeadCard'
import { Skeleton }      from '@/components/ui/Skeleton'
import type { FunnelStage, Lead } from '@/lib/types'

export function KanbanColumn({ stage, leads, loading, onLeadClick }: {
  stage: FunnelStage; leads: Lead[]; loading: boolean; onLeadClick: (lead: Lead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="text-text-primary text-sm font-medium truncate">{stage.name}</span>
        <span className="ml-auto text-text-muted text-xs bg-surface-hover px-1.5 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex flex-col gap-2 min-h-24 p-2 rounded-card transition-colors ${isOver ? 'bg-brand/10 border border-brand/30' : 'bg-surface-base'}`}>
        {loading ? (
          <><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></>
        ) : (
          <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />)}
          </SortableContext>
        )}
        {!loading && leads.length === 0 && <p className="text-text-muted text-xs text-center py-6">Nenhum lead</p>}
      </div>
    </div>
  )
}
