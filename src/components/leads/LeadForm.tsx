import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useStages } from '@/hooks/useStages'
import type { Lead } from '@/lib/types'

interface LeadFormProps {
  lead?: Lead | null
  defaultStageId?: string
  onSubmit: (data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export function LeadForm({ lead, defaultStageId, onSubmit, onCancel }: LeadFormProps) {
  const { stages } = useStages()
  const [name, setName] = useState(lead?.name ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [company, setCompany] = useState(lead?.company ?? '')
  const [jobTitle, setJobTitle] = useState(lead?.job_title ?? '')
  const [source, setSource] = useState(lead?.source ?? '')
  const [notes, setNotes] = useState(lead?.notes ?? '')
  const [stageId, setStageId] = useState(lead?.stage_id ?? defaultStageId ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      workspace_id: lead?.workspace_id ?? '',
      stage_id: stageId,
      assigned_to: lead?.assigned_to ?? null,
      name,
      email,
      phone,
      company,
      job_title: jobTitle,
      source,
      notes,
    })
  }

  const stageOptions = stages.map((s) => ({ value: s.id, label: s.name }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do lead" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        <Input label="Empresa" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Cargo" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Cargo do lead" />
        <Input label="Origem" value={source} onChange={(e) => setSource(e.target.value)} placeholder="LinkedIn, Indicacao..." />
      </div>
      <Select
        label="Etapa"
        value={stageId}
        onChange={(e) => setStageId(e.target.value)}
        options={stageOptions}
        placeholder="Selecione a etapa"
        required
      />
      <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotacoes sobre o lead..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{lead ? 'Salvar' : 'Criar Lead'}</Button>
      </div>
    </form>
  )
}
