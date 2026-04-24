import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { LeadModal } from '@/components/leads/LeadModal'
import { LeadForm } from '@/components/leads/LeadForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useLeads } from '@/hooks/useLeads'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useToast } from '@/contexts/ToastContext'
import type { Lead } from '@/lib/types'

export default function KanbanPage() {
  const { createLead } = useLeads()
  const { workspace } = useWorkspace()
  const { showToast } = useToast()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStageId, setCreateStageId] = useState('')

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setShowLeadModal(true)
  }, [])

  const handleAddLead = useCallback((stageId: string) => {
    setCreateStageId(stageId)
    setShowCreateModal(true)
  }, [])

  const handleCreateLead = useCallback(async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    if (!workspace) return
    await createLead({ ...data, workspace_id: workspace.id })
    setShowCreateModal(false)
    showToast('Lead criado com sucesso', 'success')
  }, [workspace, createLead, showToast])

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-text-primary">Pipeline</h1>
          <Button size="sm" onClick={() => handleAddLead('')}>
            <Plus size={16} className="mr-1" />
            Novo Lead
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto">
          <KanbanBoard onLeadClick={handleLeadClick} onAddLead={handleAddLead} />
        </div>
      </div>

      <LeadModal
        lead={selectedLead}
        open={showLeadModal}
        onClose={() => { setShowLeadModal(false); setSelectedLead(null) }}
      />

      {showCreateModal && (
        <Modal
          onClose={() => setShowCreateModal(false)}
          title="Novo Lead"
        >
          <LeadForm
            defaultStageId={createStageId}
            onSubmit={handleCreateLead}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </>
  )
}
