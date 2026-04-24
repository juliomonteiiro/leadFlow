import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import type { CustomFieldDefinition } from '@/lib/types'

export function useCustomFields() {
  const { workspace } = useWorkspace()
  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFields = useCallback(async () => {
    if (!workspace) {
      setFields([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('position')

    setFields((data as CustomFieldDefinition[]) ?? [])
    setLoading(false)
  }, [workspace])

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  async function createField(field: Omit<CustomFieldDefinition, 'id' | 'created_at'>) {
    const { data } = await supabase
      .from('custom_field_definitions')
      .insert(field)
      .select()
      .single()
    if (data) {
      setFields((prev) => [...prev, data as CustomFieldDefinition].sort((a, b) => a.position - b.position))
    }
    return data as CustomFieldDefinition | null
  }

  async function updateField(id: string, updates: Partial<CustomFieldDefinition>) {
    await supabase.from('custom_field_definitions').update(updates).eq('id', id)
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  async function deleteField(id: string) {
    await supabase.from('custom_field_definitions').delete().eq('id', id)
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  return { fields, loading, createField, updateField, deleteField, refreshFields: fetchFields }
}
