import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { GeneratedMessage } from '@/lib/types'

export function useMessages(leadId: string | null) {
  const [messages, setMessages] = useState<GeneratedMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!leadId) {
      setMessages([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('generated_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    setMessages((data as GeneratedMessage[]) ?? [])
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  async function markAsSent(messageId: string, variationIndex: number) {
    await supabase
      .from('generated_messages')
      .update({ was_sent: true, sent_at: new Date().toISOString(), sent_variation: variationIndex })
      .eq('id', messageId)

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, was_sent: true, sent_at: new Date().toISOString(), sent_variation: variationIndex }
          : m
      )
    )
  }

  return { messages, loading, markAsSent, refreshMessages: fetchMessages }
}
