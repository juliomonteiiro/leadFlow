import { useWorkspace as useWorkspaceCtx } from '@/contexts/WorkspaceContext'

export function useWorkspace() {
  return useWorkspaceCtx()
}
