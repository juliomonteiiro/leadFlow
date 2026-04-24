import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStages } from '@/hooks/useStages'

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

describe('useStages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workspaceMock.mockReturnValue({ workspace: { id: 'ws-1' } })
  })

  it('loads workspace stages ordered by position', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: 's1', workspace_id: 'ws-1', name: 'Base', position: 0, color: '#111', created_at: '' },
        { id: 's2', workspace_id: 'ws-1', name: 'Mapeado', position: 1, color: '#222', created_at: '' },
      ],
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    fromMock.mockImplementation(() => ({ select }))

    const { result } = renderHook(() => useStages())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stages.map((s) => s.name)).toEqual(['Base', 'Mapeado'])
    expect(eq).toHaveBeenCalledWith('workspace_id', 'ws-1')
    expect(order).toHaveBeenCalledWith('position')
  })
})
