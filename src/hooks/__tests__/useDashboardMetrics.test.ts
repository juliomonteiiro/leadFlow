import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

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

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workspaceMock.mockReturnValue({
      workspace: { id: 'ws-1', name: 'Acme', created_at: new Date().toISOString() },
    })
  })

  it('aggregates totals and stage distribution', async () => {
    const leadsByStageCount: Record<string, number> = {
      'stage-1': 3,
      'stage-2': 1,
    }
    let generatedCall = 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'generated_messages') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => {
              generatedCall += 1
              if (generatedCall === 1) return Promise.resolve({ count: 5 })
              return { eq: vi.fn().mockResolvedValue({ count: 2 }) }
            }),
          })),
        }
      }

      if (table === 'leads') {
        return {
          select: vi.fn((columns: string, options?: { head?: boolean }) => {
            if (columns === 'id' && options?.head) {
              return {
                eq: vi.fn((field: string, value: string) => {
                  if (field === 'workspace_id') return Promise.resolve({ count: 4 })
                  return Promise.resolve({ count: leadsByStageCount[value] ?? 0 })
                }),
              }
            }

            if (columns === 'id') {
              return {
                eq: vi.fn((field: string) => {
                  if (field === 'workspace_id') {
                    return Promise.resolve({ data: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }] })
                  }
                  return Promise.resolve({ data: [] })
                }),
              }
            }
            return { eq: vi.fn(() => Promise.resolve({ data: [] })) }
          }),
        }
      }

      if (table === 'funnel_stages') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'stage-1', name: 'Base', color: '#aaa', position: 0, workspace_id: 'ws-1', created_at: '' },
                  { id: 'stage-2', name: 'Mapeado', color: '#bbb', position: 1, workspace_id: 'ws-1', created_at: '' },
                ],
              }),
            })),
          })),
        }
      }

      return { select: vi.fn() }
    })

    const { result } = renderHook(() => useDashboardMetrics())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalLeads).toBe(4)
    expect(result.current.totalGenerated).toBe(5)
    expect(result.current.totalSent).toBe(2)
    expect(result.current.byStage.map((s) => s.count)).toEqual([3, 1])
  })
})
