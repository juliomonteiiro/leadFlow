import { useCallback, useState }     from 'react'
import { supabase }                  from '@/lib/supabase'
import type { GeneratedMessage, Lead, Campaign } from '@/lib/types'
import { EDGE_FN_GENERATE_MESSAGES } from '@/lib/constants'

function buildLocalVariations(lead: Lead, campaign: Campaign): string[] {
  const greeting = lead.name?.trim() ? `Olá ${lead.name.trim()}` : 'Olá'
  const context = campaign.context?.trim() || 'Seguimos interessados em entender melhor suas necessidades e como podemos ajudar.'
  const prompt = campaign.prompt?.trim()
  const company = lead.company?.trim() ? ` da ${lead.company.trim()}` : ''
  const title = lead.job_title?.trim() ? ` como ${lead.job_title.trim()}` : ''
  const source = lead.source?.trim() ? ` pela ${lead.source.trim()}` : ''

  const variation1 = `${greeting}!\n\n${context}\n\nGostaria de agendar uma conversa rápida para entender melhor seu cenário${company} e explorar como podemos gerar valor para você${title}.\n\nVocê teria disponibilidade essa semana?`
  const variation2 = `${greeting}, tudo bem?\n\nVi que você chegou até nós${source} e fiquei interessado em entender mais sobre seu momento${company}.\n\n${context}\n\nPodemos conversar por 15 minutos essa semana?`
  const variation3 = prompt
    ? `${greeting}!\n\n${prompt}\n\n${context}\n\nSe fizer sentido, avançamos com um próximo passo ainda esta semana.`
    : `${greeting}!\n\n${context}\n\nSei que seu tempo é valioso${title ? `, especialmente atuando${title}` : ''}. Posso te mostrar em poucos minutos uma proposta prática para ${lead.company?.trim() || 'sua empresa'}?`

  return [variation1, variation2, variation3]
}

export function useMessages() {
  const [generating, setGenerating] = useState(false)

  const generate = useCallback(async (leadId: string, campaignId: string): Promise<GeneratedMessage | null> => {
    setGenerating(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error } = await supabase.functions.invoke(EDGE_FN_GENERATE_MESSAGES, {
        body: { lead_id: leadId, campaign_id: campaignId, auto_generated: false },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (error) {
        const shouldFallback = error.message.includes('non-2xx')
          || error.message.includes('401')
          || error.message.includes('UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM')
        if (!shouldFallback) {
          throw error
        }

        const [{ data: lead, error: leadError }, { data: campaign, error: campaignError }] = await Promise.all([
          supabase.from('leads').select('*').eq('id', leadId).maybeSingle(),
          supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle(),
        ])

        if (leadError || campaignError || !lead || !campaign) {
          throw leadError ?? campaignError ?? new Error('Lead ou campanha não encontrado para fallback')
        }

        const variations = buildLocalVariations(lead as Lead, campaign as Campaign)
        const { data: inserted, error: insertError } = await supabase
          .from('generated_messages')
          .insert({
            lead_id: leadId,
            campaign_id: campaignId,
            variations,
            was_sent: false,
            auto_generated: false,
          })
          .select('*')
          .maybeSingle()

        if (insertError) {
          throw insertError
        }
        return inserted as GeneratedMessage
      }

      const payload = data as { data?: GeneratedMessage } | GeneratedMessage | null
      if (!payload) return null
      if (typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data
      }
      return payload as GeneratedMessage
    } finally {
      setGenerating(false)
    }
  }, [])

  const getLatest = useCallback(async (leadId: string, campaignId: string): Promise<GeneratedMessage | null> => {
    const { data, error } = await supabase.from('generated_messages').select('*')
      .eq('lead_id', leadId).eq('campaign_id', campaignId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) return null
    return data ?? null
  }, [])

  const markSent = useCallback(async (messageId: string, variationIndex: number): Promise<void> => {
    await supabase.from('generated_messages').update({
      was_sent: true, sent_variation: variationIndex, sent_at: new Date().toISOString(),
    }).eq('id', messageId)
  }, [])

  return { generating, generate, getLatest, markSent }
}
