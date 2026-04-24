import { Suspense }            from 'react'
import { Users, MessageSquare, Send, TrendingUp } from 'lucide-react'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { Skeleton }            from '@/components/ui/Skeleton'

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm">{label}</span>
        <span style={{ color }} className="opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-semibold text-text-primary">{value}</p>
    </div>
  )
}

function DashboardContent() {
  const { totalLeads, totalGenerated, totalSent, byStage, loading } = useDashboardMetrics()
  const conversionRate = totalGenerated > 0 ? Math.round((totalSent / totalGenerated) * 100) : 0
  const maxCount       = Math.max(...byStage.map((s) => s.count), 1)
  const generatedPending = Math.max(totalGenerated - totalSent, 0)
  const topStages = [...byStage].sort((a, b) => b.count - a.count).slice(0, 5)

  if (loading) return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total de leads"     value={totalLeads}     icon={<Users size={20} />}         color="#6366f1" />
        <MetricCard label="Mensagens geradas"  value={totalGenerated} icon={<MessageSquare size={20} />} color="#f59e0b" />
        <MetricCard label="Mensagens enviadas" value={totalSent}      icon={<Send size={20} />}           color="#10b981" />
        <MetricCard label="Taxa de envio (%)"  value={conversionRate} icon={<TrendingUp size={20} />}    color="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-card border border-surface-border rounded-card p-5">
          <h2 className="text-text-primary font-medium mb-4">Leads por etapa do funil</h2>
          <div className="flex flex-col gap-3">
            {byStage.map(({ stage, count }) => (
              <div key={stage.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-text-secondary text-sm">{stage.name}</span>
                  </div>
                  <span className="text-text-primary text-sm font-medium">{count}</span>
                </div>
                <div className="h-2 bg-surface-base rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: stage.color, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-card p-5">
          <h2 className="text-text-primary font-medium mb-4">Eficiência de mensagens</h2>
          <div className="flex items-center gap-6">
            <div
              className="w-28 h-28 rounded-full shrink-0"
              style={{
                background: `conic-gradient(#10b981 ${conversionRate}%, #334155 ${conversionRate}% 100%)`,
              }}
            >
              <div className="w-full h-full p-3">
                <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center border border-surface-border">
                  <span className="text-text-primary font-semibold">{conversionRate}%</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Enviadas</span>
                <span className="text-text-primary font-medium">{totalSent}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Pendentes</span>
                <span className="text-text-primary font-medium">{generatedPending}</span>
              </div>
              <div className="h-2 bg-surface-base rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-surface-border">
            <p className="text-xs text-text-muted mb-2">Top etapas com mais leads</p>
            <div className="flex flex-col gap-2">
              {topStages.map(({ stage, count }) => (
                <div key={stage.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-text-secondary flex-1 truncate">{stage.name}</span>
                  <span className="text-text-primary font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <DashboardContent />
    </Suspense>
  )
}
