import { useState, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LeadForm } from './LeadForm'
import { LeadCustomFields } from './LeadCustomFields'
import { useLeads } from '@/hooks/useLeads'
import { useMessages } from '@/hooks/useMessages'
import { useActivityLog } from '@/hooks/useActivityLog'
import { useToast } from '@/contexts/ToastContext'
import type { Lead } from '@/lib/types'
import { Send, Clock, User, ArrowRight, MessageSquare } from 'lucide-react'

interface LeadModalProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
}

const activityLabels: Record<string, string> = {
  lead_created: 'Lead criado',
  stage_changed: 'Etapa alterada',
  message_generated: 'Mensagem gerada',
  message_sent: 'Mensagem enviada',
  lead_updated: 'Lead atualizado',
}

export function LeadModal({ lead, open, onClose }: LeadModalProps) {
  const { updateLead, deleteLead } = useLeads()
  const { messages, markAsSent } = useMessages(lead?.id ?? null)
  const { logs } = useActivityLog(lead?.id ?? null)
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('data')

  const handleUpdate = useCallback(async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    if (!lead) return
    await updateLead(lead.id, data)
    setEditing(false)
    showToast('Lead atualizado com sucesso', 'success')
  }, [lead, updateLead, showToast])

  const handleDelete = useCallback(async () => {
    if (!lead) return
    await deleteLead(lead.id)
    onClose()
    showToast('Lead removido', 'success')
  }, [lead, deleteLead, onClose, showToast])

  const handleMarkSent = useCallback(async (messageId: string, variationIndex: number) => {
    await markAsSent(messageId, variationIndex)
    showToast('Mensagem marcada como enviada', 'success')
  }, [markAsSent, showToast])

  if (!lead || !open) return null

  const tabs = [
    { id: 'data', label: 'Dados' },
    { id: 'messages', label: 'Mensagens' },
    { id: 'history', label: 'Historico' },
  ]

  return (
    <Modal onClose={onClose} title={lead.name} size="lg">
      <div className="mb-4 flex items-center gap-2">
        <Badge label={lead.company || 'Sem empresa'} color="#0ea5e9" />
        {lead.source && <Badge label={lead.source} color="#64748b" />}
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
      {(() => {
        if (activeTab === 'data') {
          if (editing) {
            return <LeadForm lead={lead} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
          }
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Telefone" value={lead.phone} />
                <DetailRow label="Empresa" value={lead.company} />
                <DetailRow label="Cargo" value={lead.job_title} />
                <DetailRow label="Origem" value={lead.source} />
              </div>
              {lead.notes && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Notas</p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap bg-surface-hover rounded-input p-3">{lead.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs text-text-muted mb-2">Campos personalizados</p>
                <LeadCustomFields leadId={lead.id} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
                <Button variant="danger" size="sm" onClick={handleDelete}>Excluir</Button>
                <Button size="sm" onClick={() => setEditing(true)}>Editar</Button>
              </div>
            </div>
          )
        }

        if (activeTab === 'messages') {
          return (
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-text-muted text-center py-8">Nenhuma mensagem gerada para este lead</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="bg-surface-hover rounded-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-text-muted" />
                      <span className="text-xs text-text-muted">
                        {msg.auto_generated ? 'Gerada automaticamente' : 'Gerada manualmente'}
                      </span>
                    </div>
                    {msg.was_sent
                      ? <Badge label="Enviada" color="#22c55e" />
                      : <Badge label="Pendente" color="#f59e0b" />}
                  </div>
                  {msg.variations.map((variation, idx) => (
                    <div key={idx} className="bg-surface-card rounded-input p-3 text-sm text-text-secondary">
                      <p className="whitespace-pre-wrap">{variation}</p>
                      {!msg.was_sent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                          onClick={() => handleMarkSent(msg.id, idx)}
                        >
                          <Send size={12} className="mr-1" />
                          Marcar como enviada (variacao {idx + 1})
                        </Button>
                      )}
                      {msg.was_sent && msg.sent_variation === idx && (
                        <p className="text-xs text-success mt-1">Variacao enviada</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        }

        return (
          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-sm text-text-muted text-center py-8">Nenhuma atividade registrada</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2">
                <div className="mt-0.5">
                  {log.activity_type === 'stage_changed' ? (
                    <ArrowRight size={14} className="text-info" />
                  ) : log.activity_type === 'message_sent' ? (
                    <Send size={14} className="text-success" />
                  ) : log.activity_type === 'message_generated' ? (
                    <MessageSquare size={14} className="text-warning" />
                  ) : log.activity_type === 'lead_created' ? (
                    <User size={14} className="text-brand" />
                  ) : (
                    <Clock size={14} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{activityLabels[log.activity_type] ?? log.activity_type}</p>
                  {log.activity_type === 'stage_changed' && 'from' in log.metadata && 'to' in log.metadata && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Etapa alterada
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </Modal>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  )
}
