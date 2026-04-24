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
