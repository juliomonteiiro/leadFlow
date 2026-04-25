import { Suspense, useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { supabase }                      from '@/lib/supabase'
import { useWorkspace }                  from '@/hooks/useWorkspace'
import { useCustomFields }               from '@/hooks/useCustomFields'
import { useStages }                     from '@/hooks/useStages'
import { ConfirmDialog }                 from '@/components/ui/ConfirmDialog'
import { Modal }                         from '@/components/ui/Modal'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDefinition | null>(null)
  const [deletingField, setDeletingField] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editName, setEditName]       = useState('')
  const [editType, setEditType]       = useState<FieldType>('text')
  const [editOptions, setEditOptions] = useState('')
  const [savingEdit, setSavingEdit]   = useState(false)

  useEffect(() => { setLocalFields(fields) }, [fields])

  async function handleAdd() {
    if (!newName.trim() || !workspace) return
    setSaving(true)
    const options = newType === 'select' ? newOptions.split(',').map((o) => o.trim()).filter(Boolean) : []
    const { data } = await supabase.from('custom_field_definitions')
      .insert({ workspace_id: workspace.id, name: newName.trim(), field_type: newType, options, position: localFields.length })
      .select().single()
    if (data) setLocalFields((prev) => [...prev, data as CustomFieldDefinition])
    setNewName('')
    setNewType('text')
    setNewOptions('')
    setSaving(false)
    setShowAddModal(false)
  }

  async function handleRemove(id: string) {
    await supabase.from('custom_field_definitions').delete().eq('id', id)
    setLocalFields((prev) => prev.filter((f) => f.id !== id))
  }

  function startEdit(field: CustomFieldDefinition): void {
    setEditingFieldId(field.id)
    setEditName(field.name)
    setEditType(field.field_type)
    setEditOptions(field.options.join(', '))
  }

  function cancelEdit(): void {
    setEditingFieldId(null)
    setEditName('')
    setEditType('text')
    setEditOptions('')
  }

  async function saveEdit(fieldId: string) {
    if (!editName.trim()) return
    setSavingEdit(true)
    const options = editType === 'select'
      ? editOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : []
    const { data } = await supabase.from('custom_field_definitions')
      .update({ name: editName.trim(), field_type: editType, options })
      .eq('id', fieldId)
      .select()
      .single()
    if (data) {
      setLocalFields((prev) => prev.map((f) => (f.id === fieldId ? data as CustomFieldDefinition : f)))
    }
    setSavingEdit(false)
    cancelEdit()
  }

  if (loading) return <Skeleton className="h-40 w-full" />

  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <h2 className="text-text-primary font-medium mb-1">Campos personalizados</h2>
      <p className="text-text-muted text-xs mb-4">Campos extras disponíveis para todos os leads do workspace.</p>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-3 py-2 rounded-btn text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Adicionar campo
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        {localFields.length === 0 && <p className="text-text-muted text-sm text-center py-4">Nenhum campo criado.</p>}
        {localFields.map((field) => (
          <div key={field.id} className="p-3 bg-surface-base rounded-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-text-primary text-sm">{field.name}</span>
                <span className="ml-2 text-text-muted text-xs bg-surface-hover px-1.5 py-0.5 rounded">{field.field_type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(field)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-btn transition-colors"><Pencil size={14} /></button>
                <button onClick={() => setFieldToDelete(field)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-btn transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {fieldToDelete && (
        <ConfirmDialog
          title="Confirmar exclusão"
          message={`Tem certeza que deseja excluir o campo "${fieldToDelete.name}"? Essa ação pode afetar regras e valores já vinculados aos leads.`}
          confirmLabel="Excluir campo"
          variant="danger"
          loading={deletingField}
          onCancel={() => setFieldToDelete(null)}
          onConfirm={async () => {
            setDeletingField(true)
            await handleRemove(fieldToDelete.id)
            setDeletingField(false)
            setFieldToDelete(null)
          }}
        />
      )}
      {editingFieldId && (
        <Modal title="Editar campo personalizado" onClose={cancelEdit} size="md">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input className={F} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome do campo" />
              <select className={F} value={editType} onChange={(e) => setEditType(e.target.value as FieldType)}>
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
                <option value="select">Seleção</option>
              </select>
            </div>
            {editType === 'select' && (
              <input className={F} value={editOptions} onChange={(e) => setEditOptions(e.target.value)} placeholder="Opções separadas por vírgula" />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
              <button type="button" onClick={() => saveEdit(editingFieldId)} disabled={savingEdit || !editName.trim()} className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
                {savingEdit ? 'Salvando...' : 'Salvar campo'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showAddModal && (
        <Modal title="Adicionar campo personalizado" onClose={() => setShowAddModal(false)} size="md">
          <div className="flex flex-col gap-3">
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
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
              <button type="button" onClick={handleAdd} disabled={saving || !newName.trim()} className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
                {saving ? 'Adicionando...' : 'Adicionar campo'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StageRulesSection() {
  const { stages, loading: stagesLoading } = useStages()
  const { fields: customFields }           = useCustomFields()
  const [selectedStageId, setStageId]      = useState<string>('')
  const [allRules, setAllRules]            = useState<StageRequiredField[]>([])
  const [loadingRules, setLoadingRules]    = useState(false)
  const [ruleToDelete, setRuleToDelete]    = useState<StageRequiredField | null>(null)
  const [deletingRule, setDeletingRule]    = useState(false)
  const [editingRule, setEditingRule]      = useState<StageRequiredField | null>(null)
  const [editRuleType, setEditRuleType]    = useState<'standard' | 'custom'>('standard')
  const [editStandardField, setEditStandardField] = useState<string>('')
  const [editCustomFieldId, setEditCustomFieldId] = useState<string>('')
  const [savingRuleEdit, setSavingRuleEdit] = useState(false)
  const selectedStage = stages.find((s) => s.id === selectedStageId)
  const selectedStageRules = allRules.filter((rule) => rule.stage_id === selectedStageId)
  const usedStandardFields = new Set(
    selectedStageRules
      .map((rule) => rule.standard_field)
      .filter((field): field is string => Boolean(field))
  )
  const usedCustomFieldIds = new Set(
    selectedStageRules
      .map((rule) => rule.custom_field_id)
      .filter((fieldId): fieldId is string => Boolean(fieldId))
  )
  const availableStandardFields = STANDARD_LEAD_FIELDS.filter((field) => !usedStandardFields.has(field.key))
  const availableCustomFields = customFields.filter((field) => !usedCustomFieldIds.has(field.id))

  useEffect(() => {
    if (stages.length === 0) {
      setAllRules([])
      return
    }
    setLoadingRules(true)
    supabase.from('stage_required_fields').select('*').in('stage_id', stages.map((s) => s.id))
      .then(({ data }) => { setAllRules((data ?? []) as StageRequiredField[]); setLoadingRules(false) })
  }, [stages])

  async function addRule(payload: { standard_field?: string; custom_field_id?: string }) {
    const { data } = await supabase.from('stage_required_fields')
      .insert({ stage_id: selectedStageId, ...payload }).select().single()
    if (data) setAllRules((prev) => [...prev, data as StageRequiredField])
  }

  async function removeRule(id: string) {
    await supabase.from('stage_required_fields').delete().eq('id', id)
    setAllRules((prev) => prev.filter((r) => r.id !== id))
  }

  function openEditRule(rule: StageRequiredField): void {
    setEditingRule(rule)
    if (rule.standard_field) {
      setEditRuleType('standard')
      setEditStandardField(rule.standard_field)
      setEditCustomFieldId('')
      return
    }
    setEditRuleType('custom')
    setEditStandardField('')
    setEditCustomFieldId(rule.custom_field_id ?? '')
  }

  function closeEditRule(): void {
    setEditingRule(null)
    setEditRuleType('standard')
    setEditStandardField('')
    setEditCustomFieldId('')
  }

  async function saveEditRule() {
    if (!editingRule) return
    if (editRuleType === 'standard' && !editStandardField) return
    if (editRuleType === 'custom' && !editCustomFieldId) return

    setSavingRuleEdit(true)
    const payload = editRuleType === 'standard'
      ? { standard_field: editStandardField, custom_field_id: null }
      : { standard_field: null, custom_field_id: editCustomFieldId }
    const { data } = await supabase.from('stage_required_fields')
      .update(payload)
      .eq('id', editingRule.id)
      .select()
      .single()

    if (data) {
      setAllRules((prev) => prev.map((rule) => (rule.id === editingRule.id ? data as StageRequiredField : rule)))
    }
    setSavingRuleEdit(false)
    closeEditRule()
  }

  function getRuleLabel(rule: StageRequiredField): string {
    if (rule.standard_field) {
      const direct = STANDARD_LEAD_FIELDS.find((f) => f.key === rule.standard_field)?.label
      if (direct) return direct
      return rule.standard_field
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }
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
              <p className="text-sm text-text-secondary">
                Etapa selecionada: <span className="text-text-primary font-medium">{selectedStage?.name}</span>
              </p>
              <p className="text-xs text-text-muted">Campos obrigatórios nesta etapa:</p>
              {selectedStageRules.length === 0 && <p className="text-text-muted text-sm py-2">Nenhum campo definido.</p>}
              {selectedStageRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-2 bg-surface-base rounded-card">
                  <span className="text-text-primary text-sm">{getRuleLabel(rule)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditRule(rule)} className="p-1 text-text-muted hover:text-text-primary transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setRuleToDelete(rule)} className="p-1 text-text-muted hover:text-danger transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border pt-4">
              <p className="text-xs text-text-muted mb-2">Adicionar campo obrigatório:</p>
              <div className="flex flex-col gap-1">
                {availableStandardFields.map((f) => (
                  <button key={f.key}
                    onClick={() => addRule({ standard_field: f.key })}
                    className="text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover rounded-btn transition-colors">
                    + {f.label}
                  </button>
                ))}
                {availableCustomFields.map((f) => (
                  <button key={f.id}
                    onClick={() => addRule({ custom_field_id: f.id })}
                    className="text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover rounded-btn transition-colors">
                    + {f.name} (personalizado)
                  </button>
                ))}
                {availableStandardFields.length === 0 && availableCustomFields.length === 0 && (
                  <p className="text-xs text-text-muted py-2">Todos os campos disponíveis já foram adicionados como regra nesta etapa.</p>
                )}
              </div>
            </div>
          </>
        )
      )}
      <div className="mt-5 border-t border-surface-border pt-4">
        <p className="text-xs text-text-muted mb-2">Regras já configuradas no funil:</p>
        {stages.map((stage) => {
          const stageRules = allRules.filter((rule) => rule.stage_id === stage.id)
          if (stageRules.length === 0) return null
          return (
            <div key={stage.id} className="mb-2 rounded-card border border-surface-border p-3 bg-surface-base">
              <p className="text-sm text-text-primary font-medium mb-1">{stage.name}</p>
              <div className="flex flex-col gap-2">
                {stageRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between bg-surface-hover border border-surface-border px-2 py-1 rounded-full">
                    <span className="text-xs text-text-secondary">{getRuleLabel(rule)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setStageId(stage.id); openEditRule(rule) }} className="p-1 text-text-muted hover:text-text-primary transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => setRuleToDelete(rule)} className="p-1 text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {ruleToDelete && (
        <ConfirmDialog
          title="Confirmar exclusão"
          message={`Deseja remover a regra obrigatória "${getRuleLabel(ruleToDelete)}" desta etapa?`}
          confirmLabel="Remover regra"
          variant="danger"
          loading={deletingRule}
          onCancel={() => setRuleToDelete(null)}
          onConfirm={async () => {
            setDeletingRule(true)
            await removeRule(ruleToDelete.id)
            setDeletingRule(false)
            setRuleToDelete(null)
          }}
        />
      )}
      {editingRule && (
        <Modal title="Editar regra de transição" onClose={closeEditRule} size="md">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Tipo</label>
              <select className={F} value={editRuleType} onChange={(e) => setEditRuleType(e.target.value as 'standard' | 'custom')}>
                <option value="standard">Campo padrão</option>
                <option value="custom">Campo personalizado</option>
              </select>
            </div>
            {editRuleType === 'standard' ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Campo padrão</label>
                <select className={F} value={editStandardField} onChange={(e) => setEditStandardField(e.target.value)}>
                  <option value="">Selecionar campo...</option>
                  {STANDARD_LEAD_FIELDS
                    .filter((field) => field.key === editStandardField || !usedStandardFields.has(field.key))
                    .map((field) => (
                    <option key={field.key} value={field.key}>{field.label}</option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Campo personalizado</label>
                <select className={F} value={editCustomFieldId} onChange={(e) => setEditCustomFieldId(e.target.value)}>
                  <option value="">Selecionar campo...</option>
                  {customFields
                    .filter((field) => field.id === editCustomFieldId || !usedCustomFieldIds.has(field.id))
                    .map((field) => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeEditRule} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
              <button type="button" onClick={saveEditRule} disabled={savingRuleEdit} className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
                {savingRuleEdit ? 'Salvando...' : 'Salvar regra'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <div className="flex flex-col gap-6">
        <div className="mb-1">
          <h1 className="text-xl font-semibold text-text-primary">Configurações</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <CustomFieldsSection />
          <StageRulesSection />
        </div>
      </div>
    </Suspense>
  )
}
