import { useCallback, useEffect, useState } from 'react'
import { supabase }        from '@/lib/supabase'
import { useWorkspace }    from '@/hooks/useWorkspace'
import type { CustomFieldDefinition, LeadCustomValue } from '@/lib/types'

export function useCustomFields() {
  const { workspace }         = useWorkspace()
  const [fields, setFields]   = useState<CustomFieldDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!workspace) return
    supabase.from('custom_field_definitions').select('*')
      .eq('workspace_id', workspace.id).order('position')
      .then(({ data }) => { setFields(data ?? []); setLoading(false) })
  }, [workspace, tick])

  const getValues = useCallback(async (leadId: string): Promise<LeadCustomValue[]> => {
    const { data } = await supabase.from('lead_custom_values').select('*').eq('lead_id', leadId)
    return data ?? []
  }, [])

  const upsertValue = useCallback(async (leadId: string, fieldId: string, value: string): Promise<void> => {
    await supabase.from('lead_custom_values')
      .upsert({ lead_id: leadId, field_id: fieldId, value }, { onConflict: 'lead_id,field_id' })
  }, [])

  return { fields, loading, refetch: () => setTick((n) => n + 1), getValues, upsertValue }
}
