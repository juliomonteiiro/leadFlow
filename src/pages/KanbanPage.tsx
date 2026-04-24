import { Suspense, useState } from 'react'
import { KanbanBoard }        from '@/components/kanban/KanbanBoard'
import { Modal }              from '@/components/ui/Modal'
import { LeadForm }           from '@/components/leads/LeadForm'
import { Skeleton }           from '@/components/ui/Skeleton'
import { useLeads }           from '@/hooks/useLeads'
import { useActivityLog }     from '@/hooks/useActivityLog'
import type { Lead }          from '@/lib/types'

export default function KanbanPage() {
  const { createLead }  = useLeads()
  const { log }         = useActivityLog()
  const [showCreate, setShowCreate]     = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  async function handleCreateLead(data: Pick<Lead, 'name' | 'email' | 'phone' | 'company' | 'job_title' | 'source' | 'notes' | 'stage_id'>) {
    const created = await createLead({ ...data, assigned_to: null })
    if (created) {
      await log({ leadId: created.id, activityType: 'lead_created', metadata: { stage_id: created.stage_id } })
      setShowCreate(false)
    }
  }

  return (
    <>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <KanbanBoard onLeadClick={(lead) => setSelectedLead(lead)} onCreateClick={() => setShowCreate(true)} />
      </Suspense>
      {showCreate && (
        <Modal title="Novo Lead" onClose={() => setShowCreate(false)}>
          <LeadForm onSubmit={handleCreateLead} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {selectedLead && (
        <Modal title={selectedLead.name} onClose={() => setSelectedLead(null)} size="lg">
          <p className="text-text-secondary text-sm">Modal de detalhes — próximo prompt.</p>
        </Modal>
      )}
    </>
  )
}
