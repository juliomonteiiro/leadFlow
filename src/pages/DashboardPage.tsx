import { useEffect, useState } from 'react'
import { Users, TrendingUp, MessageSquare, Clock } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { useStages } from '@/hooks/useStages'
import { useActivityLog } from '@/hooks/useActivityLog'
import { useWorkspace } from '@/hooks/useWorkspace'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-btn ${color}`}>
          {icon}
        </div>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { leads, loading: leadsLoading } = useLeads()
  const { stages } = useStages()
  const { logs } = useActivityLog()
  const { workspace } = useWorkspace()
  const [messagesSent, setMessagesSent] = useState(0)
  const [messagesGenerated, setMessagesGenerated] = useState(0)

  useEffect(() => {
    if (!workspace) return
    supabase
      .from('generated_messages')
      .select('was_sent', { count: 'exact', head: false })
      .eq('was_sent', true)
      .then(({ count }) => setMessagesSent(count ?? 0))

    supabase
      .from('generated_messages')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setMessagesGenerated(count ?? 0))
  }, [workspace])

  const leadsByStage = stages.map((stage) => ({
    name: stage.name,
    color: stage.color,
    count: leads.filter((l) => l.stage_id === stage.id).length,
  }))

  const recentLogs = logs.slice(0, 10)

  const activityLabels: Record<string, string> = {
    lead_created: 'Lead criado',
    stage_changed: 'Etapa alterada',
    message_generated: 'Mensagem gerada',
    message_sent: 'Mensagem enviada',
    lead_updated: 'Lead atualizado',
  }

  if (leadsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users size={20} className="text-info" />}
          label="Total de Leads"
          value={leads.length}
          color="bg-info/10"
        />
        <MetricCard
          icon={<TrendingUp size={20} className="text-success" />}
          label="Mensagens Enviadas"
          value={messagesSent}
          color="bg-success/10"
        />
        <MetricCard
          icon={<MessageSquare size={20} className="text-warning" />}
          label="Mensagens Geradas"
          value={messagesGenerated}
          color="bg-warning/10"
        />
        <MetricCard
          icon={<Clock size={20} className="text-brand" />}
          label="Atividades Hoje"
          value={logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
          color="bg-brand/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card border border-surface-border rounded-card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Leads por Etapa</h2>
          <div className="space-y-3">
            {leadsByStage.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-text-secondary flex-1">{item.name}</span>
                <span className="text-sm font-semibold text-text-primary">{item.count}</span>
                <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: item.color,
                      width: leads.length > 0 ? `${(item.count / leads.length) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentLogs.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">Nenhuma atividade registrada</p>
            )}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                <span className="text-sm text-text-secondary flex-1">
                  {activityLabels[log.activity_type] ?? log.activity_type}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
