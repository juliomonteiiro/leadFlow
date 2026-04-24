import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useStages } from '@/hooks/useStages'
import { useCustomFields } from '@/hooks/useCustomFields'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import { STANDARD_LEAD_FIELDS } from '@/lib/constants'
import type { FieldType } from '@/lib/types'

export default function SettingsPage() {
  const { stages, createStage, deleteStage } = useStages()
  const { fields, createField, deleteField } = useCustomFields()
  const { workspace } = useWorkspace()
  const { showToast } = useToast()

  const [showAddStage, setShowAddStage] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [showRequiredFields, setShowRequiredFields] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState('')

  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('#6366f1')

  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<FieldType>('text')
  const [newFieldOptions, setNewFieldOptions] = useState('')

  const [requiredFields, setRequiredFields] = useState<Array<{ id: string; standard_field: string | null; custom_field_id: string | null }>>([])

  const handleAddStage = useCallback(async () => {
    if (!workspace || !newStageName.trim()) return
    await createStage(newStageName.trim(), newStageColor, stages.length)
    setShowAddStage(false)
    setNewStageName('')
    setNewStageColor('#6366f1')
    showToast('Etapa criada com sucesso', 'success')
  }, [workspace, newStageName, newStageColor, stages.length, createStage, showToast])

  const handleDeleteStage = useCallback(async (id: string) => {
    await deleteStage(id)
    showToast('Etapa removida', 'success')
  }, [deleteStage, showToast])

  const handleAddField = useCallback(async () => {
    if (!workspace || !newFieldName.trim()) return
    const options = newFieldType === 'select' && newFieldOptions
      ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : []

    await createField({
      workspace_id: workspace.id,
      name: newFieldName.trim(),
      field_type: newFieldType,
      options,
      position: fields.length,
    })
    setShowAddField(false)
    setNewFieldName('')
    setNewFieldType('text')
    setNewFieldOptions('')
    showToast('Campo personalizado criado', 'success')
  }, [workspace, newFieldName, newFieldType, newFieldOptions, fields.length, createField, showToast])

  const handleDeleteField = useCallback(async (id: string) => {
    await deleteField(id)
    showToast('Campo removido', 'success')
  }, [deleteField, showToast])

  const openRequiredFields = useCallback(async (stageId: string) => {
    setSelectedStageId(stageId)
    const { data } = await supabase
      .from('stage_required_fields')
      .select('*')
      .eq('stage_id', stageId)
    setRequiredFields((data ?? []) as Array<{ id: string; standard_field: string | null; custom_field_id: string | null }>)
    setShowRequiredFields(true)
  }, [])

  const addRequiredField = useCallback(async (type: 'standard' | 'custom', value: string) => {
    const insert = type === 'standard'
      ? { stage_id: selectedStageId, standard_field: value, custom_field_id: null }
      : { stage_id: selectedStageId, standard_field: null, custom_field_id: value }

    const { data } = await supabase
      .from('stage_required_fields')
      .insert(insert)
      .select()
      .single()

    if (data) {
      setRequiredFields((prev) => [...prev, data as { id: string; standard_field: string | null; custom_field_id: string | null }])
    }
  }, [selectedStageId])

  const removeRequiredField = useCallback(async (id: string) => {
    await supabase.from('stage_required_fields').delete().eq('id', id)
    setRequiredFields((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const fieldTypeLabels: Record<FieldType, string> = {
    text: 'Texto',
    number: 'Numero',
    date: 'Data',
    select: 'Selecao',
  }

  return (
    <div className="space-y-8 max-w-4xl">
        <h1 className="text-xl font-bold text-text-primary">Configuracoes</h1>

        {/* Stages */}
        <section className="bg-surface-card border border-surface-border rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Etapas do Funil</h2>
            <Button size="sm" onClick={() => setShowAddStage(true)}>
              <Plus size={14} className="mr-1" />
              Nova Etapa
            </Button>
          </div>

          <div className="space-y-2">
            {[...stages].sort((a, b) => a.position - b.position).map((stage) => (
              <div key={stage.id} className="flex items-center gap-3 py-2 px-3 rounded-btn hover:bg-surface-hover transition-colors">
                <GripVertical size={16} className="text-text-muted shrink-0" />
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-sm text-text-primary flex-1">{stage.name}</span>
                <Button size="sm" variant="ghost" onClick={() => openRequiredFields(stage.id)}>
                  Campos obrigatorios
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.id)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            ))}
          </div>

          {showAddStage && (
            <div className="mt-4 pt-4 border-t border-surface-border space-y-3">
              <div className="flex gap-3">
                <Input
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Nome da etapa"
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddStage}>Criar</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowAddStage(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </section>

        {/* Custom Fields */}
        <section className="bg-surface-card border border-surface-border rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Campos Personalizados</h2>
            <Button size="sm" onClick={() => setShowAddField(true)}>
              <Plus size={14} className="mr-1" />
              Novo Campo
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 py-2 px-3 rounded-btn hover:bg-surface-hover transition-colors">
                <span className="text-sm text-text-primary flex-1">{field.name}</span>
                <Badge label={fieldTypeLabels[field.field_type]} color="#64748b" />
                {field.field_type === 'select' && field.options.length > 0 && (
                  <span className="text-xs text-text-muted">{field.options.join(', ')}</span>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDeleteField(field.id)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">Nenhum campo personalizado</p>
            )}
          </div>

          {showAddField && (
            <div className="mt-4 pt-4 border-t border-surface-border space-y-3">
              <div className="flex gap-3">
                <Input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Nome do campo"
                  className="flex-1"
                />
                <Select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  options={[
                    { value: 'text', label: 'Texto' },
                    { value: 'number', label: 'Numero' },
                    { value: 'date', label: 'Data' },
                    { value: 'select', label: 'Selecao' },
                  ]}
                  className="w-32"
                />
              </div>
              {newFieldType === 'select' && (
                <Input
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  placeholder="Opcoes separadas por virgula"
                />
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddField}>Criar</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowAddField(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </section>

        {/* Required Fields Modal */}
        {showRequiredFields && (
          <Modal
            onClose={() => setShowRequiredFields(false)}
            title="Campos Obrigatorios"
            size="md"
          >
            <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Adicionar campo padrao obrigatorio</h3>
              <div className="flex gap-2">
                <Select
                  options={STANDARD_LEAD_FIELDS.map((f) => ({ value: f.key, label: f.label }))}
                  placeholder="Selecione..."
                  className="flex-1"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addRequiredField('standard', e.target.value)
                  }}
                />
              </div>
            </div>

            {fields.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Adicionar campo personalizado obrigatorio</h3>
                <Select
                  options={fields.map((f) => ({ value: f.id, label: f.name }))}
                  placeholder="Selecione..."
                  className="flex-1"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addRequiredField('custom', e.target.value)
                  }}
                />
              </div>
            )}

            <div className="pt-4 border-t border-surface-border">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Campos obrigatorios atuais</h3>
              {requiredFields.length === 0 && (
                <p className="text-sm text-text-muted">Nenhum campo obrigatorio definido</p>
              )}
              <div className="space-y-2">
                {requiredFields.map((req) => {
                  const label = req.standard_field
                    ? STANDARD_LEAD_FIELDS.find((f) => f.key === req.standard_field)?.label ?? req.standard_field
                    : fields.find((f) => f.id === req.custom_field_id)?.name ?? 'Campo removido'

                  return (
                    <div key={req.id} className="flex items-center gap-2 py-1.5 px-3 bg-surface-hover rounded-btn">
                      <span className="text-sm text-text-primary flex-1">{label}</span>
                      <button onClick={() => removeRequiredField(req.id)} className="text-text-muted hover:text-danger">
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            </div>
          </Modal>
        )}
      </div>
  )
}
