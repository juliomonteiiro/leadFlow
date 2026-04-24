import { ArrowRight, MessageSquare, Edit, Plus, Send } from 'lucide-react'
import { useLeadActivity } from '@/hooks/useLeadActivity'
import { Skeleton }        from '@/components/ui/Skeleton'
import type { ActivityLog, ActivityType } from '@/lib/types'

const LABELS: Record<ActivityType, string> = {
  lead_created:      'Lead criado',
  stage_changed:     'Etapa alterada',
  message_generated: 'Mensagens geradas pela IA',
  message_sent:      'Mensagem enviada ao lead',
  lead_updated:      'Dados atualizados',
}

const ICONS: Record<ActivityType, React.ReactNode> = {
  lead_created:      <Plus size={14} />,
  stage_changed:     <ArrowRight size={14} />,
  message_generated: <MessageSquare size={14} />,
  message_sent:      <Send size={14} />,
  lead_updated:      <Edit size={14} />,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function buildSummary(type: ActivityType, metadata: Record<string, unknown>): string | null {
  if (type === 'stage_changed') {
    const from = metadata.from as string | undefined
    const to   = metadata.to   as string | undefined
    if (from && to) return `De "${from}" para "${to}"`
  }
  if (type === 'message_sent') {
    const name = metadata.campaign_name as string | undefined
    if (name) return `Campanha: ${name}`
  }
  return null
}

export function LeadActivityTab({ leadId }: { leadId: string }) {
  const { logs, loading } = useLeadActivity(leadId)

  if (loading) return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" />
    </div>
  )

  if (logs.length === 0) return (
    <p className="text-text-muted text-sm text-center py-8">Nenhuma atividade registrada.</p>
  )

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log: ActivityLog) => {
        const summary = buildSummary(log.activity_type, log.metadata)
        return (
          <div key={log.id} className="flex items-start gap-3 p-3 bg-surface-base rounded-card">
            <span className="mt-0.5 shrink-0 text-brand">{ICONS[log.activity_type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm">{LABELS[log.activity_type]}</p>
              {summary && <p className="text-text-muted text-xs mt-0.5">{summary}</p>}
              <p className="text-text-muted text-xs mt-0.5">{formatDate(log.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
