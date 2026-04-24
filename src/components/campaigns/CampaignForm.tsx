import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useStages } from '@/hooks/useStages'
import type { Campaign } from '@/lib/types'

interface CampaignFormProps {
  campaign?: Campaign | null
  workspaceId: string
  onSubmit: (data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export function CampaignForm({ campaign, workspaceId, onSubmit, onCancel }: CampaignFormProps) {
  const { stages } = useStages()
  const [name, setName] = useState(campaign?.name ?? '')
  const [context, setContext] = useState(campaign?.context ?? '')
  const [prompt, setPrompt] = useState(campaign?.prompt ?? '')
  const [triggerStageId, setTriggerStageId] = useState(campaign?.trigger_stage_id ?? '')
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      workspace_id: workspaceId,
      name,
      context,
      prompt,
      trigger_stage_id: triggerStageId || null,
      is_active: isActive,
    })
  }

  const stageOptions = stages.map((s) => ({ value: s.id, label: s.name }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da campanha"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Follow-up inicial"
        required
      />
      <Select
        label="Etapa de disparo"
        value={triggerStageId}
        onChange={(e) => setTriggerStageId(e.target.value)}
        options={stageOptions}
        placeholder="Selecione a etapa que dispara a campanha"
      />
      <Textarea
        label="Contexto"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Contexto sobre o lead, empresa, situacao..."
        required
      />
      <Textarea
        label="Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Instrucoes para gerar a mensagem..."
        required
      />
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-brand transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm text-text-secondary">Campanha ativa</span>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{campaign ? 'Salvar' : 'Criar Campanha'}</Button>
      </div>
    </form>
  )
}
