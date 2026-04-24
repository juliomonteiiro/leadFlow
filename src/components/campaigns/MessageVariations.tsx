import { useState } from 'react'
import { Send, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { GeneratedMessage } from '@/lib/types'

interface MessageVariationsProps {
  message: GeneratedMessage
  onMarkSent: (messageId: string, variationIndex: number) => void
}

export function MessageVariations({ message, onMarkSent }: MessageVariationsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  async function copyToClipboard(text: string, idx: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {message.was_sent ? (
          <Badge label="Enviada" color="#22c55e" />
        ) : (
          <Badge label="Pendente" color="#f59e0b" />
        )}
        {message.auto_generated && <Badge label="Automatica" color="#64748b" />}
      </div>

      {message.variations.map((variation, idx) => (
        <div key={idx} className="bg-surface-hover rounded-input p-4">
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{variation}</p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(variation, idx)}
            >
              {copiedIdx === idx ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
              {copiedIdx === idx ? 'Copiado' : 'Copiar'}
            </Button>
            {!message.was_sent && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onMarkSent(message.id, idx)}
              >
                <Send size={12} className="mr-1" />
                Marcar como enviada
              </Button>
            )}
            {message.was_sent && message.sent_variation === idx && (
              <span className="text-xs text-success">Variacao enviada</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
