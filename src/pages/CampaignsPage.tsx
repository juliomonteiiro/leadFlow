import { Suspense, useState }        from 'react'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'
import { useCampaigns }  from '@/hooks/useCampaigns'
import { useStages }     from '@/hooks/useStages'
import { CampaignForm }  from '@/components/campaigns/CampaignForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal }         from '@/components/ui/Modal'
import { Skeleton }      from '@/components/ui/Skeleton'
import type { Campaign } from '@/lib/types'

function CampaignsList() {
  const { campaigns, loading, create, update, remove } = useCampaigns()
  const { stages }                                     = useStages()
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState(false)

  function getStageName(id: string | null) {
    if (!id) return 'Nenhuma'
    return stages.find((s) => s.id === id)?.name ?? 'Desconhecida'
  }

  if (loading) return <div className="flex flex-col gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Campanhas</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          <Plus size={14} />Nova campanha
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">Nenhuma campanha criada ainda.</p>
          <p className="text-xs mt-1">Crie uma campanha para começar a gerar mensagens com IA.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-surface-card border border-surface-border rounded-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-text-primary font-medium truncate">{campaign.name}</h3>
                  {!campaign.is_active && <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-surface-border shrink-0">Inativa</span>}
                </div>
                <p className="text-text-secondary text-sm line-clamp-2">{campaign.context}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Zap size={12} className="text-warning shrink-0" />
                  <span className="text-xs text-text-muted">Gatilho: {getStageName(campaign.trigger_stage_id)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(campaign)} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-btn transition-colors"><Pencil size={14} /></button>
                <button onClick={() => setCampaignToDelete(campaign)} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-btn transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Nova campanha" onClose={() => setShowForm(false)} size="lg">
          <CampaignForm onSubmit={async (data) => { await create(data); setShowForm(false) }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Editar campanha" onClose={() => setEditing(null)} size="lg">
          <CampaignForm initial={editing} onSubmit={async (data) => { await update(editing.id, data); setEditing(null) }} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {campaignToDelete && (
        <ConfirmDialog
          title="Confirmar exclusão"
          message={`Tem certeza que deseja excluir a campanha "${campaignToDelete.name}"? Mensagens vinculadas a ela também podem ser impactadas.`}
          confirmLabel="Excluir campanha"
          variant="danger"
          loading={deletingCampaign}
          onCancel={() => setCampaignToDelete(null)}
          onConfirm={async () => {
            setDeletingCampaign(true)
            await remove(campaignToDelete.id)
            setDeletingCampaign(false)
            setCampaignToDelete(null)
          }}
        />
      )}
    </>
  )
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CampaignsList />
    </Suspense>
  )
}
