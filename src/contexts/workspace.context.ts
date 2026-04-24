import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Workspace } from '@/lib/types'

export interface WorkspaceContextValue {
  workspace: Workspace | null
  user: User | null
  loading: boolean
  refetch: () => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
