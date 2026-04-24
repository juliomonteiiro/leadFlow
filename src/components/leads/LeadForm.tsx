import { useEffect, useState, type FormEvent }  from 'react'
import { useStages } from '@/hooks/useStages'
import { LEAD_SOURCE_OPTIONS } from '@/lib/constants'
import type { Lead } from '@/lib/types'

type LeadFormData = Pick<Lead, 'name' | 'email' | 'phone' | 'company' | 'job_title' | 'source' | 'notes' | 'stage_id'>

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-sm'
const L = 'text-xs text-text-secondary mb-1'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function LeadForm({ initialStageId, onSubmit, onCancel }: { initialStageId?: string; onSubmit: (data: LeadFormData) => Promise<void>; onCancel: () => void }) {
  const { stages }            = useStages()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<{ email?: string; phone?: string; stage_id?: string }>({})
  const [form, setForm]       = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    source: LEAD_SOURCE_OPTIONS[0],
    notes: '',
    stage_id: initialStageId ?? '',
  })

  useEffect(() => {
    if (!form.stage_id && stages[0]?.id) {
      setForm((prev) => ({ ...prev, stage_id: stages[0].id }))
    }
  }, [form.stage_id, stages])

  function set(field: keyof LeadFormData, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }
  function validateEmail(value: string) {
    setErrors((prev) => ({ ...prev, email: value.trim() !== '' && !isValidEmail(value) ? 'Informe um email válido.' : undefined }))
  }
  function validatePhone(value: string) {
    setErrors((prev) => ({ ...prev, phone: value.trim() !== '' && !isValidPhone(value) ? 'Telefone deve ter DDD + número (10 ou 11 dígitos).' : undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: { email?: string; phone?: string; stage_id?: string } = {}

    if (form.email.trim() !== '' && !isValidEmail(form.email)) {
      nextErrors.email = 'Informe um email válido.'
    }
    if (form.phone.trim() !== '' && !isValidPhone(form.phone)) {
      nextErrors.phone = 'Telefone deve ter DDD + número (10 ou 11 dígitos).'
    }
    if (!form.stage_id) {
      nextErrors.stage_id = 'Selecione uma etapa válida.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    await onSubmit(form)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col col-span-2"><label className={L}>Nome *</label><input className={F} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do lead" required /></div>
        <div className="flex flex-col">
          <label className={L}>Email</label>
          <input
            className={`${F} ${errors.email ? 'border-danger focus:border-danger' : ''}`}
            type="email"
            value={form.email}
            onChange={(e) => {
              const value = e.target.value
              set('email', value)
              if (errors.email) validateEmail(value)
            }}
            onBlur={(e) => validateEmail(e.target.value)}
            placeholder="email@empresa.com"
          />
          {errors.email && <span className="text-danger text-xs mt-1">{errors.email}</span>}
        </div>
        <div className="flex flex-col">
          <label className={L}>Telefone</label>
          <input
            className={`${F} ${errors.phone ? 'border-danger focus:border-danger' : ''}`}
            value={form.phone}
            onChange={(e) => {
              const value = formatPhone(e.target.value)
              set('phone', value)
              if (errors.phone) validatePhone(value)
            }}
            onBlur={(e) => validatePhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
          {errors.phone && <span className="text-danger text-xs mt-1">{errors.phone}</span>}
        </div>
        <div className="flex flex-col"><label className={L}>Empresa</label><input className={F} value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Nome da empresa" /></div>
        <div className="flex flex-col"><label className={L}>Cargo</label><input className={F} value={form.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder="Ex: CEO, Gerente..." /></div>
        <div className="flex flex-col">
          <label className={L}>Origem</label>
          <select className={F} value={form.source} onChange={(e) => set('source', e.target.value)}>
            {LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </div>
        <div className="flex flex-col"><label className={L}>Etapa</label>
          <select className={F} value={form.stage_id} onChange={(e) => set('stage_id', e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.stage_id && <span className="text-danger text-xs mt-1">{errors.stage_id}</span>}
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
