import { useState, type FormEvent }  from 'react'
import { useStages } from '@/hooks/useStages'
import type { Lead } from '@/lib/types'

type LeadFormData = Pick<Lead, 'name' | 'email' | 'phone' | 'company' | 'job_title' | 'source' | 'notes' | 'stage_id'>

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-sm'
const L = 'text-xs text-text-secondary mb-1'

export function LeadForm({ initialStageId, onSubmit, onCancel }: { initialStageId?: string; onSubmit: (data: LeadFormData) => Promise<void>; onCancel: () => void }) {
  const { stages }            = useStages()
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState<LeadFormData>({ name: '', email: '', phone: '', company: '', job_title: '', source: '', notes: '', stage_id: initialStageId ?? stages[0]?.id ?? '' })

  function set(field: keyof LeadFormData, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }

  async function handleSubmit(e: FormEvent) { e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false) }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col col-span-2"><label className={L}>Nome *</label><input className={F} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do lead" required /></div>
        <div className="flex flex-col"><label className={L}>Email</label><input className={F} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@empresa.com" /></div>
        <div className="flex flex-col"><label className={L}>Telefone</label><input className={F} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 99999-9999" /></div>
        <div className="flex flex-col"><label className={L}>Empresa</label><input className={F} value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Nome da empresa" /></div>
        <div className="flex flex-col"><label className={L}>Cargo</label><input className={F} value={form.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder="Ex: CEO, Gerente..." /></div>
        <div className="flex flex-col"><label className={L}>Origem</label><input className={F} value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="Ex: LinkedIn, Indicação..." /></div>
        <div className="flex flex-col"><label className={L}>Etapa</label>
          <select className={F} value={form.stage_id} onChange={(e) => set('stage_id', e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col col-span-2"><label className={L}>Observações</label><textarea className={`${F} resize-none`} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Informações adicionais..." /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
        <button type="submit" disabled={loading} className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">{loading ? 'Salvando...' : 'Criar lead'}</button>
      </div>
    </form>
  )
}
