import { useCallback, useEffect, useState } from 'react'
import { useCustomFields }  from '@/hooks/useCustomFields'
import { useActivityLog }   from '@/hooks/useActivityLog'
import { useLeads }         from '@/hooks/useLeads'
import type { Lead, LeadCustomValue } from '@/lib/types'

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-sm'
const L = 'text-xs text-text-secondary mb-1 block'

export function LeadDataTab({ lead, onUpdate }: { lead: Lead; onUpdate: (u: Lead) => void }) {
  const { fields, getValues, upsertValue } = useCustomFields()
  const { log }        = useActivityLog()
  const { updateLead } = useLeads()
  const [form, setForm]                 = useState<Lead>(lead)
  const [customValues, setCustomValues] = useState<LeadCustomValue[]>([])
  const [saving, setSaving]             = useState(false)

  const loadCustomValues = useCallback(async () => {
    setCustomValues(await getValues(lead.id))
  }, [lead.id, getValues])

  useEffect(() => { loadCustomValues() }, [loadCustomValues])

  function handleChange(field: keyof Lead, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCustomChange(fieldId: string, value: string) {
    setCustomValues((prev) => {
      const exists = prev.find((v) => v.field_id === fieldId)
      if (exists) return prev.map((v) => (v.field_id === fieldId ? { ...v, value } : v))
      return [...prev, { id: '', lead_id: lead.id, field_id: fieldId, value }]
    })
  }

  async function handleSave() {
    setSaving(true)
    const updated = await updateLead(lead.id, {
      name: form.name, email: form.email, phone: form.phone,
      company: form.company, job_title: form.job_title,
      source: form.source, notes: form.notes,
    })
    for (const cv of customValues) {
      if (cv.value.trim() !== '') await upsertValue(lead.id, cv.field_id, cv.value)
    }
    await log({ leadId: lead.id, activityType: 'lead_updated' })
    if (updated) onUpdate(updated)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col"><label className={L}>Nome</label>
          <input className={F} value={form.name} onChange={(e) => handleChange('name', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Email</label>
          <input className={F} type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Telefone</label>
          <input className={F} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Empresa</label>
          <input className={F} value={form.company} onChange={(e) => handleChange('company', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Cargo</label>
          <input className={F} value={form.job_title} onChange={(e) => handleChange('job_title', e.target.value)} /></div>
        <div className="col-span-2 flex flex-col"><label className={L}>Origem</label>
          <input className={F} value={form.source} onChange={(e) => handleChange('source', e.target.value)} /></div>
        <div className="col-span-2 flex flex-col"><label className={L}>Observações</label>
          <textarea className={`${F} resize-none`} rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} /></div>
      </div>

      {fields.length > 0 && (
        <>
          <hr className="border-surface-border" />
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Campos personalizados</p>
          <p className="text-xs text-text-muted -mt-2">Edite os campos extras vinculados a este lead.</p>
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.id} className="flex flex-col">
                <label className={L}>{field.name}</label>
                {field.field_type === 'select' ? (
                  <select className={F} value={customValues.find((v) => v.field_id === field.id)?.value ?? ''} onChange={(e) => handleCustomChange(field.id, e.target.value)}>
                    <option value="">Selecionar...</option>
                    {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input className={F}
                    type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                    value={customValues.find((v) => v.field_id === field.id)?.value ?? ''}
                    onChange={(e) => handleCustomChange(field.id, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving}
          className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
