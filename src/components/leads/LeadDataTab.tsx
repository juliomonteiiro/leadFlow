import { useCallback, useEffect, useState } from 'react'
import { useCustomFields }  from '@/hooks/useCustomFields'
import { useActivityLog }   from '@/hooks/useActivityLog'
import { useLeads }         from '@/hooks/useLeads'
import { ConfirmDialog }    from '@/components/ui/ConfirmDialog'
import { LEAD_SOURCE_OPTIONS } from '@/lib/constants'
import type { Lead, LeadCustomValue } from '@/lib/types'

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-sm'
const L = 'text-xs text-text-secondary mb-1 block'
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

export function LeadDataTab({ lead, onUpdate }: { lead: Lead; onUpdate: (u: Lead) => void }) {
  const { fields, getValues, upsertValue } = useCustomFields()
  const { log }        = useActivityLog()
  const { updateLead } = useLeads()
  const [form, setForm]                 = useState<Lead>(lead)
  const [customValues, setCustomValues] = useState<LeadCustomValue[]>([])
  const [saving, setSaving]             = useState(false)
  const [errors, setErrors]             = useState<{ email?: string; phone?: string }>({})
  const [showSensitiveConfirm, setShowSensitiveConfirm] = useState(false)

  const loadCustomValues = useCallback(async () => {
    setCustomValues(await getValues(lead.id))
  }, [lead.id, getValues])

  useEffect(() => { loadCustomValues() }, [loadCustomValues])

  function handleChange(field: keyof Lead, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function validateEmail(value: string) {
    setErrors((prev) => ({ ...prev, email: value.trim() !== '' && !isValidEmail(value) ? 'Informe um email válido.' : undefined }))
  }
  function validatePhone(value: string) {
    setErrors((prev) => ({ ...prev, phone: value.trim() !== '' && !isValidPhone(value) ? 'Telefone deve ter DDD + número (10 ou 11 dígitos).' : undefined }))
  }

  function handleCustomChange(fieldId: string, value: string) {
    setCustomValues((prev) => {
      const exists = prev.find((v) => v.field_id === fieldId)
      if (exists) return prev.map((v) => (v.field_id === fieldId ? { ...v, value } : v))
      return [...prev, { id: '', lead_id: lead.id, field_id: fieldId, value }]
    })
  }

  async function persistSave() {
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

  async function handleSave() {
    const nextErrors: { email?: string; phone?: string } = {}
    if (form.email.trim() !== '' && !isValidEmail(form.email)) {
      nextErrors.email = 'Informe um email válido.'
    }
    if (form.phone.trim() !== '' && !isValidPhone(form.phone)) {
      nextErrors.phone = 'Telefone deve ter DDD + número (10 ou 11 dígitos).'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const sensitiveChanged =
      form.email.trim() !== (lead.email ?? '').trim()
      || form.phone.trim() !== (lead.phone ?? '').trim()

    if (sensitiveChanged) {
      setShowSensitiveConfirm(true)
      return
    }

    await persistSave()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col"><label className={L}>Nome</label>
          <input className={F} value={form.name} onChange={(e) => handleChange('name', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Email</label>
          <input
            className={`${F} ${errors.email ? 'border-danger focus:border-danger' : ''}`}
            type="email"
            value={form.email}
            onChange={(e) => {
              const value = e.target.value
              handleChange('email', value)
              if (errors.email) validateEmail(value)
            }}
            onBlur={(e) => validateEmail(e.target.value)}
          />
          {errors.email && <span className="text-danger text-xs mt-1">{errors.email}</span>}
        </div>
        <div className="flex flex-col"><label className={L}>Telefone</label>
          <input
            className={`${F} ${errors.phone ? 'border-danger focus:border-danger' : ''}`}
            value={form.phone}
            onChange={(e) => {
              const value = formatPhone(e.target.value)
              handleChange('phone', value)
              if (errors.phone) validatePhone(value)
            }}
            onBlur={(e) => validatePhone(e.target.value)}
          />
          {errors.phone && <span className="text-danger text-xs mt-1">{errors.phone}</span>}
        </div>
        <div className="flex flex-col"><label className={L}>Empresa</label>
          <input className={F} value={form.company} onChange={(e) => handleChange('company', e.target.value)} /></div>
        <div className="flex flex-col"><label className={L}>Cargo</label>
          <input className={F} value={form.job_title} onChange={(e) => handleChange('job_title', e.target.value)} /></div>
        <div className="col-span-2 flex flex-col"><label className={L}>Origem</label>
          <select className={F} value={form.source} onChange={(e) => handleChange('source', e.target.value)}>
            {LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </div>
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
      {showSensitiveConfirm && (
        <ConfirmDialog
          title="Confirmar edição de dados sensíveis"
          message="Você alterou email ou telefone do lead. Deseja confirmar essa atualização?"
          confirmLabel="Confirmar edição"
          loading={saving}
          onCancel={() => setShowSensitiveConfirm(false)}
          onConfirm={async () => {
            setShowSensitiveConfirm(false)
            await persistSave()
          }}
        />
      )}
    </div>
  )
}
