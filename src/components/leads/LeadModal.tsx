import { useState }        from 'react'
import { Modal }           from '@/components/ui/Modal'
import { Tabs }            from '@/components/ui/Tabs'
import { LeadDataTab }     from '@/components/leads/LeadDataTab'
import { LeadActivityTab } from '@/components/leads/LeadActivityTab'
import type { Lead }       from '@/lib/types'

const TABS = [
  { id: 'data',     label: 'Dados' },
  { id: 'messages', label: 'Mensagens' },
  { id: 'activity', label: 'Histórico' },
]

export function LeadModal({ lead, onClose, onUpdate }: { lead: Lead; onClose: () => void; onUpdate: (u: Lead) => void }) {
  const [activeTab, setActiveTab] = useState('data')

  return (
    <Modal onClose={onClose} title={lead.name} size="lg">
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      {activeTab === 'data'     && <LeadDataTab lead={lead} onUpdate={onUpdate} />}
      {activeTab === 'messages' && <p className="text-text-muted text-sm text-center py-8">Integração com IA — próximo prompt.</p>}
      {activeTab === 'activity' && <LeadActivityTab leadId={lead.id} />}
    </Modal>
  )
}
