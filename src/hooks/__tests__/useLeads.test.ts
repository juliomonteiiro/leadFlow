import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeads } from '@/hooks/useLeads'

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

function makeFetchChain(data: unknown[] = []) {
  const order = vi.fn().mockResolvedValue({ data })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  return { select, eq, order }
}

describe('useLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workspaceMock.mockReturnValue({ workspace: { id: 'ws-1' } })
  })

  it('creates lead with trimmed payload and workspace id', async () => {
    const fetch = makeFetchChain()
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'lead-1',
        workspace_id: 'ws-1',
        stage_id: 'stage-1',
        assigned_to: null,
        name: 'Maria',
        email: 'maria@acme.com',
        phone: '11999999999',
        company: 'ACME',
        job_title: 'SDR',
        source: 'LinkedIn',
        notes: 'novo lead',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    })
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })

    fromMock.mockImplementation((table: string) => {
      if (table === 'leads') return { ...fetch, insert, update: vi.fn() }
      return { select: vi.fn() }
    })

    const { result } = renderHook(() => useLeads())

    await waitFor(() => expect(result.current.loading).toBe(false))

    const created = await result.current.createLead({
      stage_id: 'stage-1',
      assigned_to: null,
      name: '  Maria  ',
      email: '  maria@acme.com ',
      phone: ' 11999999999 ',
      company: ' ACME ',
      job_title: ' SDR ',
      source: ' LinkedIn ',
      notes: ' novo lead ',
    })

    expect(created?.name).toBe('Maria')
    expect(insert).toHaveBeenCalledWith({
      workspace_id: 'ws-1',
      stage_id: 'stage-1',
      assigned_to: null,
      name: 'Maria',
      email: 'maria@acme.com',
      phone: '11999999999',
      company: 'ACME',
      job_title: 'SDR',
      source: 'LinkedIn',
      notes: 'novo lead',
    })
  })

  it('returns null when supabase insert fails', async () => {
    const fetch = makeFetchChain()
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'bad request', details: null, hint: null, code: '400' },
    })
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
    fromMock.mockImplementation(() => ({ ...fetch, insert, update: vi.fn() }))

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useLeads())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const created = await result.current.createLead({
      stage_id: 'stage-1',
      assigned_to: null,
      name: 'Maria',
      email: 'maria@acme.com',
      phone: '11999999999',
      company: 'ACME',
      job_title: 'SDR',
      source: 'LinkedIn',
      notes: '',
    })

    expect(created).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
