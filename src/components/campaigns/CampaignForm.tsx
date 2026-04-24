import { useState }      from 'react'
import { useStages }     from '@/hooks/useStages'
import type { Campaign } from '@/lib/types'

type CampaignFormData = Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'workspace_id'>

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-sm'
const L = 'text-xs text-text-secondary mb-1 block'

export function CampaignForm({ initial, onSubmit, onCancel }: { initial?: Partial<CampaignFormData>; onSubmit: (data: CampaignFormData) => Promise<void>; onCancel: () => void }) {
  const { stages }            = useStages()
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState<CampaignFormData>({
    name: initial?.name ?? '', context: initial?.context ?? '',
    prompt: initial?.prompt ?? '', trigger_stage_id: initial?.trigger_stage_id ?? null,
    is_active: initial?.is_active ?? true,
  })

  function set(field: keyof CampaignFormData, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label className={L}>Nome da campanha *</label>
        <input className={F} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Black Friday 2024" required />
      </div>
      <div className="flex flex-col">
        <label className={L}>Contexto da campanha *</label>
        <p className="text-xs text-text-muted mb-1">Descreva o produto, oferta e informações para a IA gerar mensagens de qualidade.</p>
        <textarea className={`${F} resize-none`} rows={5} value={form.context} onChange={(e) => set('context', e.target.value)} placeholder="Descreva o produto, oferta, período, condições..." required />
      </div>
      <div className="flex flex-col">
        <label className={L}>Prompt de geração *</label>
        <p className="text-xs text-text-muted mb-1">Tom, formato, estilo. Mencione quais campos do lead usar.</p>
        <textarea className={`${F} resize-none`} rows={5} value={form.prompt} onChange={(e) => set('prompt', e.target.value)} placeholder="Tom consultivo. Use nome e empresa do lead. Até 3 parágrafos. Finalize com pergunta." required />
      </div>
      <div className="flex flex-col">
        <label className={L}>Etapa gatilho (opcional)</label>
        <p className="text-xs text-text-muted mb-1">Mensagens geradas automaticamente quando lead entrar nesta etapa.</p>
        <select className={F} value={form.trigger_stage_id ?? ''} onChange={(e) => set('trigger_stage_id', e.target.value || null)}>
          <option value="">Nenhuma — somente geração manual</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-brand" />
        <label htmlFor="is_active" className="text-sm text-text-secondary cursor-pointer">Campanha ativa</label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
        <button type="submit" disabled={loading} className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          {loading ? 'Salvando...' : 'Salvar campanha'}
        </button>
      </div>
    </form>
  )
}
