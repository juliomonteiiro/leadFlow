import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Building2, Mail, Phone } from 'lucide-react'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  onClick: (lead: Lead) => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', stageId: lead.stage_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className={[
        'bg-surface-card border border-surface-border rounded-card p-3 cursor-pointer',
        'hover:border-brand/40 hover:shadow-md transition-all group',
        isDragging ? 'opacity-50 shadow-lg scale-105' : '',
      ].join(' ')}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-2 truncate">{lead.name}</h3>

      <div className="space-y-1">
        {lead.company && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Building2 size={12} />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Mail size={12} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Phone size={12} />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.source && (
        <div className="mt-2 pt-2 border-t border-surface-border">
          <span className="text-[10px] font-medium text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">
            {lead.source}
          </span>
        </div>
      )}
    </div>
  )
}
