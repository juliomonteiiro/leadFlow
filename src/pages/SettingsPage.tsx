import { Suspense, useEffect, useState } from 'react'
import { Plus, Trash2 }                  from 'lucide-react'
import { supabase }                      from '@/lib/supabase'
import { useWorkspace }                  from '@/contexts/WorkspaceContext'
import { useCustomFields }               from '@/hooks/useCustomFields'
import { useStages }                     from '@/hooks/useStages'
import { Skeleton }                      from '@/components/ui/Skeleton'
import { STANDARD_LEAD_FIELDS }          from '@/lib/constants'
import type { CustomFieldDefinition, StageRequiredField, FieldType } from '@/lib/types'

const F = 'bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary focus:outline-none focus:border-brand text-sm'

function CustomFieldsSection() {
  const { fields, loading }           = useCustomFields()
  const { workspace }                 = useWorkspace()
  const [localFields, setLocalFields] = useState<CustomFieldDefinition[]>([])
  const [newName, setNewName]         = useState('')
  const [newType, setNewType]         = useState<FieldType>('text')
  const [newOptions, setNewOptions]   = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => { setLocalFields(fields) }, [fields])

  async function handleAdd() {
    if (!newName.trim() || !workspace) return
    setSaving(true)
    const options = newType === 'select' ? newOptions.split(',').map((o) => o.trim()).filter(Boolean) : []
    const { data } = await supabase.from('custom_field_definitions')
      .insert({ workspace_id: workspace.id, name: newName.trim(), field_type: newType, options, position: localFields.length })
      .select().single()
    if (data) setLocalFields((prev) => [...prev, data as CustomFieldDefinition])
    setNewName(''); setNewOptions(''); setSaving(false)
  }

  async function handleRemove(id: string) {
    await supabase.from('custom_field_definitions').delete().eq('id', id)
    setLocalFields((prev) => prev.filter((f) => f.id !== id))
  }

  if (loading) return <Skeleton className="h-40 w-full" />

  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <h2 className="text-text-primary font-medium mb-1">Campos personalizados</h2>
      <p className="text-text-muted text-xs mb-4">Campos extras disponíveis para todos os leads do workspace.</p>
      <div className="flex flex-col gap-2 mb-4">
        {localFields.length === 0 && <p className="text-text-muted text-sm text-center py-4">Nenhum campo criado.</p>}
        {localFields.map((field) => (
          <div key={field.id} className="flex items-center justify-between p-3 bg-surface-base rounded-card">
            <div>
              <span className="text-text-primary text-sm">{field.name}</span>
              <span className="ml-2 text-text-muted text-xs bg-surface-hover px-1.5 py-0.5 rounded">{field.field_type}</span>
            </div>
            <button onClick={() => handleRemove(field.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-btn transition-colors"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-surface-border pt-4">
        <div className="grid grid-cols-2 gap-2">
          <input className={F} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do campo" />
          <select className={F} value={newType} onChange={(e) => setNewType(e.target.value as FieldType)}>
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="date">Data</option>
            <option value="select">Seleção</option>
          </select>
        </div>
        {newType === 'select' && (
          <input className={F} value={newOptions} onChange={(e) => setNewOptions(e.target.value)} placeholder="Opções separadas por vírgula" />
        )}
        <button onClick={handleAdd} disabled={saving || !newName.trim()}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white py-2 rounded-btn text-sm font-medium transition-colors">
          <Plus size={14} />{saving ? 'Adicionando...' : 'Adicionar campo'}
        </button>
      </div>
    </div>
  )
}

function StageRulesSection() {
  const { stages, loading: stagesLoading } = useStages()
  const { fields: customFields }           = useCustomFields()
  const [selectedStageId, setStageId]      = useState<string>('')
  const [rules, setRules]                  = useState<StageRequiredField[]>([])
  const [loadingRules, setLoadingRules]    = useState(false)

  useEffect(() => {
    if (!selectedStageId) { setRules([]); return }
    setLoadingRules(true)
    supabase.from('stage_required_fields').select('*').eq('stage_id', selectedStageId)
      .then(({ data }) => { setRules((data ?? []) as StageRequiredField[]); setLoadingRules(false) })
  }, [selectedStageId])

  async function addRule(payload: { standard_field?: string; custom_field_id?: string }) {
    const { data } = await supabase.from('stage_required_fields')
      .insert({ stage_id: selectedStageId, ...payload }).select().single()
    if (data) setRules((prev) => [...prev, data as StageRequiredField])
  }

  async function removeRule(id: string) {
    await supabase.from('stage_required_fields').delete().eq('id', id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  function getRuleLabel(rule: StageRequiredField): string {
    if (rule.standard_field) return STANDARD_LEAD_FIELDS.find((f) => f.key === rule.standard_field)?.label ?? rule.standard_field
    return customFields.find((f) => f.id === rule.custom_field_id)?.name ?? 'Campo personalizado'
  }

  if (stagesLoading) return <Skeleton className="h-40 w-full" />

  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <h2 className="text-text-primary font-medium mb-1">Regras de transição</h2>
      <p className="text-text-muted text-xs mb-4">Campos obrigatórios para mover um lead para cada etapa.</p>
      <div className="flex flex-col gap-1 mb-4">
        <label className="text-xs text-text-secondary">Etapa</label>
        <select className={F} value={selectedStageId} onChange={(e) => setStageId(e.target.value)}>
          <option value="">Selecionar etapa...</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selectedStageId && (
        loadingRules ? <Skeleton className="h-20 w-full" /> : (
          <>
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xs text-text-muted">Campos obrigatórios nesta etapa:</p>
              {rules.length === 0 && <p className="text-text-muted text-sm py-2">Nenhum campo definido.</p>}
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-2 bg-surface-base rounded-card">
                  <span className="text-text-primary text-sm">{getRuleLabel(rule)}</span>
                  <button onClick={() => removeRule(rule.id)} className="p-1 text-text-muted hover:text-danger transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border pt-4">
              <p className="text-xs text-text-muted mb-2">Adicionar campo obrigatório:</p>
              <div className="flex flex-col gap-1">
                {STANDARD_LEAD_FIELDS.map((f) => (
                  <button key={f.key} disabled={rules.some((r) => r.standard_field === f.key)}
                    onClick={() => addRule({ standard_field: f.key })}
                    className="text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-btn transition-colors">
                    + {f.label}
                  </button>
                ))}
                {customFields.map((f) => (
                  <button key={f.id} disabled={rules.some((r) => r.custom_field_id === f.id)}
                    onClick={() => addRule({ custom_field_id: f.id })}
                    className="text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-btn transition-colors">
                    + {f.name} (personalizado)
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-text-primary">Configurações</h1>
        <CustomFieldsSection />
        <StageRulesSection />
      </div>
    </Suspense>
  )
}
