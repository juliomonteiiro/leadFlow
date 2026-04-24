import { Zap } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { user, workspace } = useWorkspace()
  const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined
  const firstName = fullName?.trim().split(/\s+/)[0]
  const fallbackName = user?.email?.split('@')[0]
  const userName = firstName ?? fallbackName ?? 'usuário'

  const brandColumnClass = sidebarCollapsed
    ? 'shrink-0 min-w-[12rem] px-3'
    : 'w-56 shrink-0 px-3'

  return (
    <header className="h-14 bg-surface-card border-b border-surface-border flex items-center shrink-0">
      <div className={`${brandColumnClass} flex items-center min-w-0`}>
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <Zap size={sidebarCollapsed ? 20 : 22} className="text-brand shrink-0" />
          <span className="text-text-primary font-semibold tracking-tight truncate text-base sm:text-lg">
            LeadFlow
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center min-w-0 px-6">
        <span className="text-text-secondary text-sm whitespace-nowrap shrink-0">
          Bem-vindo, <span className="text-text-primary font-medium">{userName}</span>
        </span>
        <div className="flex-1 min-w-0" />
        {workspace?.name && (
          <span className="text-xs text-text-secondary bg-surface-base border border-surface-border px-2.5 py-1 rounded-full truncate max-w-[22rem]">
            Workspace: <span className="text-text-primary font-medium">{workspace.name}</span>
          </span>
        )}
      </div>
    </header>
  )
}
