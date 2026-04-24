import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar }  from '@/components/layout/Sidebar'
import { Header }   from '@/components/layout/Header'
import { Toast }    from '@/components/ui/Toast'
import { useToast } from '@/contexts/ToastContext'

export function AppShell() {
  const { toast, hideToast } = useToast()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-surface-base flex flex-col">
      <Header sidebarCollapsed={sidebarCollapsed} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-auto p-6 flex flex-col min-h-0"><Outlet /></main>
      </div>
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
