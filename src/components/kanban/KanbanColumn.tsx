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
    <div className="flex flex-col w-80 shrink-0 h-full min-h-0">
      <div className="flex items-center gap-2.5 mb-3 px-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="text-text-primary text-sm font-medium truncate">{stage.name}</span>
        <span className="ml-auto text-text-muted text-xs bg-surface-hover px-1.5 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex-1 min-h-[440px] flex flex-col gap-2 p-2.5 rounded-card border transition-colors overflow-y-auto ${isOver ? 'bg-brand/10 border-brand/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]' : 'bg-surface-base border-surface-border'}`}>
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
