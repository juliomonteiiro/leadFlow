import { useEffect, useState } from 'react'
import { useCustomFields } from '@/hooks/useCustomFields'
import { useLeads } from '@/hooks/useLeads'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { LeadCustomValue } from '@/lib/types'

interface LeadCustomFieldsProps {
  leadId: string
}

export function LeadCustomFields({ leadId }: LeadCustomFieldsProps) {
  const { fields, loading: fieldsLoading } = useCustomFields()
  const { getCustomValues, setCustomValue } = useLeads()
  const [values, setValues] = useState<LeadCustomValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomValues(leadId).then((data) => {
      setValues(data)
      setLoading(false)
    })
  }, [leadId, getCustomValues])

  async function handleChange(fieldId: string, value: string) {
    setValues((prev) => {
      const existing = prev.find((v) => v.field_id === fieldId)
      if (existing) {
        return prev.map((v) => (v.field_id === fieldId ? { ...v, value } : v))
      }
      return [...prev, { id: '', lead_id: leadId, field_id: fieldId, value }]
    })
    await setCustomValue(leadId, fieldId, value)
  }

  if (fieldsLoading || loading) return <div className="text-sm text-text-muted">Carregando...</div>
  if (fields.length === 0) return <div className="text-sm text-text-muted">Nenhum campo personalizado configurado</div>

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const currentValue = values.find((v) => v.field_id === field.id)?.value ?? ''

        if (field.field_type === 'select') {
          return (
            <Select
              key={field.id}
              label={field.name}
              value={currentValue}
              onChange={(e) => handleChange(field.id, e.target.value)}
              options={field.options.map((opt) => ({ value: opt, label: opt }))}
              placeholder="Selecione..."
            />
          )
        }

        return (
          <Input
            key={field.id}
            label={field.name}
            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
            value={currentValue}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        )
      })}
    </div>
  )
}
