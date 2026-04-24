import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCustomFields } from '@/hooks/useCustomFields'

const { fromMock, workspaceMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  workspaceMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

vi.mock('@/hooks/useWorkspace', () => ({
  useWorkspace: () => workspaceMock(),
}))

describe('useCustomFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workspaceMock.mockReturnValue({ workspace: { id: 'ws-1' } })
  })

  it('loads custom fields, returns values, and upserts values', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'f1', workspace_id: 'ws-1', name: 'Segmento' }] })
    const eq = vi.fn().mockReturnValue({ order })
    const selectForFields = vi.fn().mockReturnValue({ eq })

    const selectValues = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ id: 'v1', lead_id: 'l1', field_id: 'f1', value: 'SaaS' }] }),
    })
    const upsert = vi.fn().mockResolvedValue({})

    fromMock.mockImplementation((table: string) => {
      if (table === 'custom_field_definitions') return { select: selectForFields }
      return { select: selectValues, upsert }
    })

    const { result } = renderHook(() => useCustomFields())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.fields.length).toBe(1)

    const values = await result.current.getValues('l1')
    expect(values[0].value).toBe('SaaS')

    await result.current.upsertValue('l1', 'f1', 'Fintech')
    expect(upsert).toHaveBeenCalledWith(
      { lead_id: 'l1', field_id: 'f1', value: 'Fintech' },
      { onConflict: 'lead_id,field_id' }
    )
  })
})
