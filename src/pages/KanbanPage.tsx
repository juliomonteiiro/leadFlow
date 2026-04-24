import { Suspense, useState } from 'react'
import { KanbanBoard }        from '@/components/kanban/KanbanBoard'
import { Modal }              from '@/components/ui/Modal'
import { LeadForm }           from '@/components/leads/LeadForm'
import { LeadModal }          from '@/components/leads/LeadModal'
import { Skeleton }           from '@/components/ui/Skeleton'
import { useLeads }           from '@/hooks/useLeads'
import { useActivityLog }     from '@/hooks/useActivityLog'
import { useToast }           from '@/hooks/useToast'
import type { Lead }          from '@/lib/types'

export default function KanbanPage() {
  const { createLead }  = useLeads()
  const { log }         = useActivityLog()
  const { showToast }   = useToast()
  const [showCreate, setShowCreate]     = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  async function handleCreateLead(data: Pick<Lead, 'name' | 'email' | 'phone' | 'company' | 'job_title' | 'source' | 'notes' | 'stage_id'>) {
    const created = await createLead({ ...data, assigned_to: null })
    if (created) {
      await log({ leadId: created.id, activityType: 'lead_created', metadata: { stage_id: created.stage_id } })
      setShowCreate(false)
      showToast('Lead criado com sucesso.', 'success')
    } else {
      showToast('Não foi possível criar o lead. Verifique os dados e tente novamente.', 'error')
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <KanbanBoard onLeadClick={(lead) => setSelectedLead(lead)} onCreateClick={() => setShowCreate(true)} />
      </Suspense>
      {showCreate && (
        <Modal title="Novo Lead" onClose={() => setShowCreate(false)}>
          <LeadForm onSubmit={handleCreateLead} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => setSelectedLead(updated)}
        />
      )}
    </div>
  )
}
