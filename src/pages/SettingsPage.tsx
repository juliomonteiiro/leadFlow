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
  const [allRules, setAllRules]            = useState<StageRequiredField[]>([])
  const [loadingRules, setLoadingRules]    = useState(false)

  const [ruleModalOpen, setRuleModalOpen]  = useState(false)
  const [ruleModalMode, setRuleModalMode]  = useState<'create' | 'edit'>('create')
  const [ruleModalStageId, setRuleModalStageId] = useState<string>('')
  const [selectedStandardKeys, setSelectedStandardKeys] = useState<Set<string>>(new Set())
  const [selectedCustomIds, setSelectedCustomIds] = useState<Set<string>>(new Set())
  const [savingRuleModal, setSavingRuleModal] = useState(false)

  type RuleDeleteTarget = { type: 'stage'; stageId: string; stageName: string }

  const [deleteTarget, setDeleteTarget] = useState<RuleDeleteTarget | null>(null)
  const [deletingRules, setDeletingRules] = useState(false)

  useEffect(() => {
    if (stages.length === 0) {
      setAllRules([])
      return
    }
    setLoadingRules(true)
    supabase.from('stage_required_fields').select('*').in('stage_id', stages.map((s) => s.id))
      .then(({ data }) => { setAllRules((data ?? []) as StageRequiredField[]); setLoadingRules(false) })
  }, [stages])

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

  function getStageRules(stageId: string): StageRequiredField[] {
    return allRules.filter((rule) => rule.stage_id === stageId)
  }

  const stagesWithRules = stages.filter((stage) => getStageRules(stage.id).length > 0)
  const stagesWithoutRules = stages.filter((stage) => getStageRules(stage.id).length === 0)

  function openCreateRuleModal(): void {
    setRuleModalMode('create')
    setRuleModalStageId(stagesWithoutRules[0]?.id ?? '')
    setSelectedStandardKeys(new Set())
    setSelectedCustomIds(new Set())
    setRuleModalOpen(true)
  }

  function openEditStageRules(stageId: string): void {
    setRuleModalMode('edit')
    setRuleModalStageId(stageId)
    const rules = getStageRules(stageId)
    const std = new Set<string>()
    const custom = new Set<string>()
    for (const rule of rules) {
      if (rule.standard_field) std.add(rule.standard_field)
      if (rule.custom_field_id) custom.add(rule.custom_field_id)
    }
    setSelectedStandardKeys(std)
    setSelectedCustomIds(custom)
    setRuleModalOpen(true)
  }

  function closeRuleModal(): void {
    setRuleModalOpen(false)
    setRuleModalMode('create')
    setRuleModalStageId('')
    setSelectedStandardKeys(new Set())
    setSelectedCustomIds(new Set())
  }

  function toggleStandard(key: string): void {
    setSelectedStandardKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleCustom(id: string): void {
    setSelectedCustomIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function persistStageRules(stageId: string, nextStandardKeys: Set<string>, nextCustomIds: Set<string>): Promise<void> {
    const existing = getStageRules(stageId)
    const existingStandard = new Set(existing.map((r) => r.standard_field).filter(Boolean) as string[])
    const existingCustom = new Set(existing.map((r) => r.custom_field_id).filter(Boolean) as string[])

    const toRemove = existing.filter((rule) => {
      if (rule.standard_field) return !nextStandardKeys.has(rule.standard_field)
      if (rule.custom_field_id) return !nextCustomIds.has(rule.custom_field_id)
      return true
    })

    const toInsertStandard = [...nextStandardKeys].filter((key) => !existingStandard.has(key))
    const toInsertCustom = [...nextCustomIds].filter((id) => !existingCustom.has(id))

    for (const rule of toRemove) {
      await supabase.from('stage_required_fields').delete().eq('id', rule.id)
    }

    const inserts: Array<{ stage_id: string; standard_field: string | null; custom_field_id: string | null }> = [
      ...toInsertStandard.map((standard_field) => ({ stage_id: stageId, standard_field, custom_field_id: null })),
      ...toInsertCustom.map((custom_field_id) => ({ stage_id: stageId, standard_field: null, custom_field_id })),
    ]

    if (inserts.length > 0) {
      const { data } = await supabase.from('stage_required_fields').insert(inserts).select()
      const created = (data ?? []) as StageRequiredField[]
      setAllRules((prev) => {
        const without = prev.filter((r) => !toRemove.some((x) => x.id === r.id))
        return [...without, ...created]
      })
      return
    }

    setAllRules((prev) => prev.filter((r) => !toRemove.some((x) => x.id === r.id)))
  }

  async function saveRuleModal(): Promise<void> {
    if (!ruleModalStageId) return
    setSavingRuleModal(true)
    await persistStageRules(ruleModalStageId, selectedStandardKeys, selectedCustomIds)
    setSavingRuleModal(false)
    closeRuleModal()
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return
    setDeletingRules(true)
    const ids = getStageRules(deleteTarget.stageId).map((r) => r.id)
    if (ids.length > 0) {
      await supabase.from('stage_required_fields').delete().in('id', ids)
      setAllRules((prev) => prev.filter((r) => r.stage_id !== deleteTarget.stageId))
    }
    setDeletingRules(false)
    setDeleteTarget(null)
    if (ruleModalOpen && ruleModalMode === 'edit' && ruleModalStageId === deleteTarget.stageId) {
      closeRuleModal()
    }
  }

  const chipBase = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors'
  const chipOff = 'border-surface-border text-text-secondary bg-surface-base hover:bg-surface-hover'
  const chipOn = 'border-brand/40 text-text-primary bg-brand/15'

  if (stagesLoading) return <Skeleton className="h-40 w-full" />

  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-text-primary font-medium">Regras de transição</h2>
          <p className="text-text-muted text-xs mt-1">Campos obrigatórios para mover um lead para cada etapa.</p>
        </div>
        <button
          type="button"
          onClick={openCreateRuleModal}
          disabled={stagesWithoutRules.length === 0}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-3 py-2 rounded-btn text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={14} />
          Adicionar regra
        </button>
      </div>

      {loadingRules ? (
        <Skeleton className="h-40 w-full mt-4" />
      ) : (
        <div className="flex flex-col gap-2 mt-4">
          {stagesWithRules.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6">Nenhuma regra configurada ainda.</p>
          )}
          {stagesWithRules.map((stage) => {
            const stageRules = getStageRules(stage.id)
            const preview = stageRules.map(getRuleLabel).slice(0, 6).join(' · ')
            const extra = stageRules.length > 6 ? ` (+${stageRules.length - 6})` : ''
            return (
              <div
                key={stage.id}
                role="button"
                tabIndex={0}
                onClick={() => openEditStageRules(stage.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openEditStageRules(stage.id)
                  }
                }}
                className="w-full text-left p-3 bg-surface-base rounded-card border border-surface-border hover:border-brand/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary text-sm font-medium truncate">{stage.name}</span>
                      <span className="text-text-muted text-xs bg-surface-hover px-1.5 py-0.5 rounded-full border border-surface-border shrink-0">
                        {stageRules.length} {stageRules.length === 1 ? 'regra' : 'regras'}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-1 line-clamp-2">{preview}{extra}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="p-1.5 text-text-muted">
                      <Pencil size={14} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteTarget({ type: 'stage', stageId: stage.id, stageName: stage.name })
                      }}
                      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-btn transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Remover regra de transição ${deleteTarget.stageName}`}
          message={`Isso vai remover todas as regras configuradas para a etapa "${deleteTarget.stageName}".`}
          confirmLabel="Remover regras"
          variant="danger"
          loading={deletingRules}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {ruleModalOpen && (
        <Modal
          title={ruleModalMode === 'create' ? 'Adicionar regra de transição' : `Editar regras da etapa · ${stages.find((s) => s.id === ruleModalStageId)?.name ?? ''}`}
          onClose={closeRuleModal}
          size="md"
        >
          <div className="flex flex-col gap-4">
            {ruleModalMode === 'create' ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Etapa</label>
                <select
                  className={F}
                  value={ruleModalStageId}
                  onChange={(e) => {
                    setRuleModalStageId(e.target.value)
                    setSelectedStandardKeys(new Set())
                    setSelectedCustomIds(new Set())
                  }}
                >
                  <option value="">Selecionar etapa...</option>
                  {stagesWithoutRules.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
                {stagesWithoutRules.length === 0 && (
                  <p className="text-xs text-text-muted">Todas as etapas já possuem regras configuradas.</p>
                )}
              </div>
            ) : (
              <div className="rounded-card border border-surface-border bg-surface-base px-3 py-2">
                <p className="text-xs text-text-muted">Etapa</p>
                <p className="text-sm text-text-primary font-medium">{stages.find((s) => s.id === ruleModalStageId)?.name ?? ''}</p>
              </div>
            )}

            <div className="border-t border-surface-border pt-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Campos padrão</p>
              <div className="flex flex-wrap gap-2">
                {STANDARD_LEAD_FIELDS.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => toggleStandard(field.key)}
                    className={`${chipBase} ${selectedStandardKeys.has(field.key) ? chipOn : chipOff}`}
                  >
                    {field.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-surface-border pt-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Campos personalizados</p>
              {customFields.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhum campo personalizado criado.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {customFields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleCustom(field.id)}
                      className={`${chipBase} ${selectedCustomIds.has(field.id) ? chipOn : chipOff}`}
                    >
                      {field.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-text-muted -mt-2">
              Desmarcar um campo e salvar remove a regra correspondente, sem confirmação extra.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
              <button type="button" onClick={closeRuleModal} className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover transition-colors">Cancelar</button>
              <button
                type="button"
                onClick={saveRuleModal}
                disabled={savingRuleModal || !ruleModalStageId || (selectedStandardKeys.size === 0 && selectedCustomIds.size === 0)}
                className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
              >
                {savingRuleModal ? 'Salvando...' : ruleModalMode === 'create' ? 'Criar regras' : 'Salvar alterações'}
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
