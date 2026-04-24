import { useContext } from 'react'
import { WorkspaceContext } from '@/contexts/workspace.context'
import type { WorkspaceContextValue } from '@/contexts/workspace.context'

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
