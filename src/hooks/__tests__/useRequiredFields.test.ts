import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRequiredFields } from '@/hooks/useRequiredFields'
import type { Lead } from '@/lib/types'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

const baseLead: Lead = {
  id: 'lead-1',
  workspace_id: 'ws-1',
  stage_id: 'stage-1',
  assigned_to: null,
  name: 'Ana',
  email: 'ana@acme.com',
  phone: '',
  company: 'ACME',
  job_title: '',
  source: 'LinkedIn',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('useRequiredFields', () => {
  it('returns missing standard and custom required fields', async () => {
    const rulesEq = vi.fn().mockResolvedValue({
      data: [
        { standard_field: 'phone', custom_field_id: null, custom_field_definitions: null },
        { standard_field: null, custom_field_id: 'custom-1', custom_field_definitions: [{ name: 'Segmento' }] },
      ],
    })

    const customSingle = vi.fn().mockResolvedValue({ data: { value: '' } })
    const customEqField = vi.fn().mockReturnValue({ single: customSingle })
    const customEqLead = vi.fn().mockReturnValue({ eq: customEqField })
    const customSelect = vi.fn().mockReturnValue({ eq: customEqLead })

    fromMock.mockImplementation((table: string) => {
      if (table === 'stage_required_fields') {
        return { select: vi.fn().mockReturnValue({ eq: rulesEq }) }
      }
      return { select: customSelect }
    })

    const { result } = renderHook(() => useRequiredFields())
    const missing = await result.current.checkRequiredFields(baseLead, 'target-stage')

    expect(missing).toEqual([{ label: 'phone' }, { label: 'Segmento' }])
  })

  it('returns empty array when no rules exist', async () => {
    const rulesEq = vi.fn().mockResolvedValue({ data: [] })
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({ eq: rulesEq }),
    }))

    const { result } = renderHook(() => useRequiredFields())
    const missing = await result.current.checkRequiredFields(baseLead, 'target-stage')
    expect(missing).toEqual([])
  })
})
