import { useCallback, useState }     from 'react'
import { supabase }                  from '@/lib/supabase'
import type { GeneratedMessage }     from '@/lib/types'
import { EDGE_FN_GENERATE_MESSAGES } from '@/lib/constants'

export function useMessages() {
  const [generating, setGenerating] = useState(false)

  const generate = useCallback(async (leadId: string, campaignId: string): Promise<GeneratedMessage | null> => {
    setGenerating(true)
    const { data, error } = await supabase.functions.invoke(EDGE_FN_GENERATE_MESSAGES, {
      body: { lead_id: leadId, campaign_id: campaignId, auto_generated: false },
    })
    setGenerating(false)
    if (error) return null
    return data as GeneratedMessage
  }, [])

  const getLatest = useCallback(async (leadId: string, campaignId: string): Promise<GeneratedMessage | null> => {
    const { data } = await supabase.from('generated_messages').select('*')
      .eq('lead_id', leadId).eq('campaign_id', campaignId)
      .order('created_at', { ascending: false }).limit(1).single()
    return data ?? null
  }, [])

  const markSent = useCallback(async (messageId: string, variationIndex: number): Promise<void> => {
    await supabase.from('generated_messages').update({
      was_sent: true, sent_variation: variationIndex, sent_at: new Date().toISOString(),
    }).eq('id', messageId)
  }, [])

  return { generating, generate, getLatest, markSent }
}
