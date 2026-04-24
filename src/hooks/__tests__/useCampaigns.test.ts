import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCampaigns } from '@/hooks/useCampaigns'

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

describe('useCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workspaceMock.mockReturnValue({ workspace: { id: 'ws-1' } })
  })

  it('loads campaigns and creates a campaign with workspace id', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'c1', name: 'Camp', workspace_id: 'ws-1' }] })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const single = vi.fn().mockResolvedValue({ data: { id: 'c2', name: 'Nova', workspace_id: 'ws-1' } })
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })

    fromMock.mockImplementation(() => ({ select, insert, update: vi.fn(), delete: vi.fn() }))

    const { result } = renderHook(() => useCampaigns())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const created = await result.current.create({
      trigger_stage_id: null,
      name: 'Nova',
      context: 'ctx',
      prompt: 'p',
      is_active: true,
    })

    expect(created?.workspace_id).toBe('ws-1')
    expect(insert).toHaveBeenCalledWith({
      trigger_stage_id: null,
      name: 'Nova',
      context: 'ctx',
      prompt: 'p',
      is_active: true,
      workspace_id: 'ws-1',
    })
  })
})
