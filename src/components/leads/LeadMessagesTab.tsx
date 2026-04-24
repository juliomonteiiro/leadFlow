import { useState }          from 'react'
import { useCampaigns }      from '@/hooks/useCampaigns'
import { MessageVariations } from '@/components/campaigns/MessageVariations'
import { Skeleton }          from '@/components/ui/Skeleton'
import type { Lead }         from '@/lib/types'

export function LeadMessagesTab({ lead }: { lead: Lead }) {
  const { campaigns, loading }      = useCampaigns()
  const [selectedId, setSelectedId] = useState<string>('')
  const activeCampaigns             = campaigns.filter((c) => c.is_active)
  const selected                    = activeCampaigns.find((c) => c.id === selectedId)

  if (loading) return <Skeleton className="h-20 w-full" />
  if (activeCampaigns.length === 0) return (
    <p className="text-text-muted text-sm text-center py-8">Nenhuma campanha ativa. Crie uma campanha primeiro.</p>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">Campanha</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
          className="bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary focus:outline-none focus:border-brand text-sm">
          <option value="">Selecionar campanha...</option>
          {activeCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selected && <MessageVariations lead={lead} campaignId={selected.id} campaignName={selected.name} />}
    </div>
  )
}
