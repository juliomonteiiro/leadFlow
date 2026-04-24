import { useCallback, useEffect, useState } from 'react'
import { Copy, Send, RefreshCw }            from 'lucide-react'
import { useMessages }               from '@/hooks/useMessages'
import { useActivityLog }            from '@/hooks/useActivityLog'
import { useLeads }                  from '@/hooks/useLeads'
import { useStages }                 from '@/hooks/useStages'
import { useToast }                  from '@/contexts/ToastContext'
import { Skeleton }                  from '@/components/ui/Skeleton'
import { STAGE_TRYING_CONTACT_NAME } from '@/lib/constants'
import type { GeneratedMessage, Lead } from '@/lib/types'

export function MessageVariations({ lead, campaignId, campaignName }: { lead: Lead; campaignId: string; campaignName: string }) {
  const { generate, getLatest, markSent, generating } = useMessages()
  const { log }         = useActivityLog()
  const { updateStage } = useLeads()
  const { stages }      = useStages()
  const { showToast }   = useToast()
  const [message, setMessage] = useState<GeneratedMessage | null>(null)
  const [copied, setCopied]   = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)

  const loadLatest = useCallback(async () => {
    setMessage(await getLatest(lead.id, campaignId))
  }, [lead.id, campaignId, getLatest])

  useEffect(() => { loadLatest() }, [loadLatest])

  async function handleGenerate() {
    const result = await generate(lead.id, campaignId)
    if (result) {
      setMessage(result)
      await log({ leadId: lead.id, activityType: 'message_generated', metadata: { campaign_id: campaignId, campaign_name: campaignName } })
    } else {
      showToast('Erro ao gerar mensagens. Tente novamente.', 'error')
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSend(variationIndex: number) {
    if (!message) return
    setSending(variationIndex)
    await markSent(message.id, variationIndex)
    await log({ leadId: lead.id, activityType: 'message_sent', metadata: { campaign_id: campaignId, campaign_name: campaignName, variation: variationIndex } })
    const tryingStage = stages.find((s) => s.name === STAGE_TRYING_CONTACT_NAME)
    if (tryingStage && lead.stage_id !== tryingStage.id) {
      await updateStage(lead.id, tryingStage.id)
      await log({ leadId: lead.id, activityType: 'stage_changed', metadata: { from: lead.stage_id, to: tryingStage.id, reason: 'message_sent' } })
    }
    setMessage((prev) => prev ? { ...prev, was_sent: true, sent_variation: variationIndex } : prev)
    setSending(null)
    showToast('Mensagem marcada como enviada!', 'success')
  }

  const variations: string[] = message?.variations ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Gerando...' : variations.length > 0 ? 'Regerar mensagens' : 'Gerar mensagens'}
        </button>
      </div>

      {generating && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
        </div>
      )}

      {!generating && variations.length === 0 && (
        <div className="text-center py-10 text-text-muted">
          <p className="text-sm">Nenhuma mensagem gerada ainda.</p>
          <p className="text-xs mt-1">Clique em "Gerar mensagens" para criar sugestões personalizadas.</p>
        </div>
      )}

      {!generating && variations.map((text, index) => (
        <div key={index} className="bg-surface-base border border-surface-border rounded-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Variação {index + 1}</span>
            {message?.was_sent && message.sent_variation === index && (
              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">Enviada</span>
            )}
          </div>
          <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={() => handleCopy(text, index)}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary border border-surface-border rounded-btn px-3 py-1.5 transition-colors">
              <Copy size={12} />{copied === index ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={() => handleSend(index)} disabled={sending !== null || (message?.was_sent ?? false)}
              className="flex items-center gap-1.5 text-xs bg-success/10 text-success border border-success/20 rounded-btn px-3 py-1.5 hover:bg-success/20 disabled:opacity-50 transition-colors">
              <Send size={12} />{sending === index ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
