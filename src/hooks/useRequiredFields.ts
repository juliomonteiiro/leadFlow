import { useCallback }           from 'react'
import { supabase }              from '@/lib/supabase'
import type { Lead }             from '@/lib/types'
import type { StandardFieldKey } from '@/lib/constants'

export function useRequiredFields() {
  const checkRequiredFields = useCallback(async (lead: Lead, targetStageId: string): Promise<Array<{ label: string }>> => {
    const { data: rules } = await supabase
      .from('stage_required_fields')
      .select('standard_field, custom_field_id, custom_field_definitions ( name )')
      .eq('stage_id', targetStageId)

    if (!rules || rules.length === 0) return []
    const missing: Array<{ label: string }> = []

    for (const rule of rules) {
      if (rule.standard_field) {
        const value = lead[rule.standard_field as StandardFieldKey as keyof Lead]
        if (!value || String(value).trim() === '') missing.push({ label: rule.standard_field })
      }
      if (rule.custom_field_id) {
        const { data: cv } = await supabase.from('lead_custom_values').select('value')
          .eq('lead_id', lead.id).eq('field_id', rule.custom_field_id).maybeSingle()
        const defs = rule.custom_field_definitions as Array<{ name: string }> | null
        const customName = defs?.[0]?.name
        if (!cv?.value || cv.value.trim() === '') missing.push({ label: customName ?? 'Campo personalizado' })
      }
    }
    return missing
  }, [])

  return { checkRequiredFields }
}
