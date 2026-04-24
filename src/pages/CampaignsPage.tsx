import { useState, useCallback } from 'react'
import { Plus, Megaphone, Trash2, CreditCard as Edit2, Power, PowerOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useStages } from '@/hooks/useStages'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useToast } from '@/contexts/ToastContext'
import type { Campaign } from '@/lib/types'

export default function CampaignsPage() {
  const { campaigns, createCampaign, updateCampaign, deleteCampaign } = useCampaigns()
  const { stages } = useStages()
  const { workspace } = useWorkspace()
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const handleCreate = useCallback(async (data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    await createCampaign(data)
    setShowForm(false)
    showToast('Campanha criada com sucesso', 'success')
  }, [createCampaign, showToast])

  const handleUpdate = useCallback(async (data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingCampaign) return
    await updateCampaign(editingCampaign.id, data)
    setEditingCampaign(null)
    showToast('Campanha atualizada', 'success')
  }, [editingCampaign, updateCampaign, showToast])

  const handleToggleActive = useCallback(async (campaign: Campaign) => {
    await updateCampaign(campaign.id, { is_active: !campaign.is_active })
    showToast(campaign.is_active ? 'Campanha desativada' : 'Campanha ativada', 'success')
  }, [updateCampaign, showToast])

  const handleDelete = useCallback(async (id: string) => {
    await deleteCampaign(id)
    showToast('Campanha removida', 'success')
  }, [deleteCampaign, showToast])

  function getStageName(stageId: string | null): string {
    if (!stageId) return 'Sem etapa de disparo'
    return stages.find((s) => s.id === stageId)?.name ?? 'Etapa removida'
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Campanhas</h1>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-1" />
            Nova Campanha
          </Button>
        </div>

        {campaigns.length === 0 && (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center">
            <Megaphone size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-1">Nenhuma campanha criada</p>
            <p className="text-sm text-text-muted">Crie campanhas para gerar mensagens automaticamente quando leads mudam de etapa</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-surface-card border border-surface-border rounded-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{campaign.name}</h3>
                  <p className="text-xs text-text-muted mt-1">Disparo: {getStageName(campaign.trigger_stage_id)}</p>
                </div>
                <Badge
                  label={campaign.is_active ? 'Ativa' : 'Inativa'}
                  color={campaign.is_active ? '#22c55e' : '#64748b'}
                />
              </div>

              {campaign.context && (
                <p className="text-xs text-text-secondary mb-2 line-clamp-2">{campaign.context}</p>
              )}

              {campaign.prompt && (
                <p className="text-xs text-text-muted mb-3 line-clamp-2">{campaign.prompt}</p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
                <Button size="sm" variant="ghost" onClick={() => handleToggleActive(campaign)}>
                  {campaign.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                  {campaign.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingCampaign(campaign)}>
                  <Edit2 size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(campaign.id)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <Modal
          onClose={() => setShowForm(false)}
          title="Nova Campanha"
        >
          {workspace && (
            <CampaignForm
              workspaceId={workspace.id}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          )}
        </Modal>
      )}

      {editingCampaign && (
        <Modal
          onClose={() => setEditingCampaign(null)}
          title="Editar Campanha"
        >
          {workspace && (
            <CampaignForm
              campaign={editingCampaign}
              workspaceId={workspace.id}
              onSubmit={handleUpdate}
              onCancel={() => setEditingCampaign(null)}
            />
          )}
        </Modal>
      )}
    </>
  )
}
