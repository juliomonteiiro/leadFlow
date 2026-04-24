import { NavLink }                                     from 'react-router-dom'
import { Kanban, BarChart2, Megaphone, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth }      from '@/hooks/useAuth'
import { useTheme }     from '@/hooks/useTheme'

const NAV_ITEMS = [
  { to: '/kanban',    icon: <Kanban size={18} />,    label: 'Kanban' },
  { to: '/dashboard', icon: <BarChart2 size={18} />, label: 'Dashboard' },
  { to: '/campaigns', icon: <Megaphone size={18} />, label: 'Campanhas' },
  { to: '/settings',  icon: <Settings size={18} />,  label: 'Configurações' },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

function getUserIdentity(fullName: string | undefined, email: string | undefined) {
  const normalizedName = fullName?.trim()
  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return {
        initials: `${parts[0][0]}${parts[1][0]}`.toUpperCase(),
        displayName: normalizedName,
      }
    }

    return {
      initials: normalizedName.slice(0, 2).toUpperCase(),
      displayName: normalizedName,
    }
  }

  const safeEmail = email ?? 'usuario@leadflow.com'
  return {
    initials: safeEmail.slice(0, 2).toUpperCase(),
    displayName: safeEmail.split('@')[0],
  }
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useWorkspace()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined
  const email = user?.email ?? undefined
  const identity = getUserIdentity(fullName, email)

  return (
    <aside className={`h-full shrink-0 bg-surface-card border-r border-surface-border flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
      <nav className="flex flex-col gap-1 p-2.5 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-3 py-1.5 rounded-btn text-sm transition-colors ${
                isActive ? 'bg-brand text-white' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}>
            {item.icon}
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2.5 border-t border-surface-border space-y-1.5">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-2.5 py-2 rounded-btn ${collapsed ? '' : 'border border-surface-border/60'}`}>
          <div className="h-9 w-9 shrink-0 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-semibold">
            {identity.initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs text-text-primary truncate">{identity.displayName}</p>
              <p className="text-[11px] text-text-muted truncate">{email ?? 'Sem email'}</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className={`w-full inline-flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-2.5 py-2 rounded-btn text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors`}
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          {!collapsed && 'Recolher menu'}
        </button>
        <button
          onClick={toggleTheme}
          className={`w-full inline-flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-2.5 py-2 rounded-btn text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors`}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && (theme === 'dark' ? 'Modo claro' : 'Modo escuro')}
        </button>
        <button
          onClick={signOut}
          className={`w-full inline-flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-2.5 py-2 rounded-btn text-sm text-danger hover:bg-danger/10 transition-colors`}
        >
          <LogOut size={14} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
