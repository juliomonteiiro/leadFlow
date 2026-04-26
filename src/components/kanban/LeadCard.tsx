import { useDraggable }  from '@dnd-kit/core'
import { Building2, User } from 'lucide-react'
import type { Lead }     from '@/lib/types'

export function LeadCard({ lead, onClick }: { lead: Lead; onClick: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div
      data-kanban-card
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.35 : 1 }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-surface-card border border-surface-border rounded-card p-3.5 cursor-grab active:cursor-grabbing hover:border-brand hover:bg-surface-hover/40 transition-colors"
    >
      <p className="text-text-primary text-sm font-medium truncate">{lead.name}</p>
      {lead.company && (
        <div className="flex items-center gap-1 mt-1.5">
          <Building2 size={12} className="text-text-muted shrink-0" />
          <span className="text-text-muted text-xs truncate">{lead.company}</span>
        </div>
      )}
      {lead.job_title && (
        <div className="flex items-center gap-1 mt-0.5">
          <User size={12} className="text-text-muted shrink-0" />
          <span className="text-text-muted text-xs truncate">{lead.job_title}</span>
        </div>
      )}
    </div>
  )
}
