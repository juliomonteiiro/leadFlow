import { lazy, Suspense }                         from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider }                          from '@/contexts/ThemeContext'
import { WorkspaceProvider }                      from '@/contexts/WorkspaceContext'
import { ToastProvider }                          from '@/contexts/ToastContext'
import { ProtectedRoute }                         from '@/components/layout/ProtectedRoute'
import { AppShell }                               from '@/components/layout/AppShell'
import { Skeleton }                               from '@/components/ui/Skeleton'

const LoginPage     = lazy(() => import('@/pages/LoginPage'))
const RegisterPage  = lazy(() => import('@/pages/RegisterPage'))
const KanbanPage    = lazy(() => import('@/pages/KanbanPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage'))
const SettingsPage  = lazy(() => import('@/pages/SettingsPage'))

const pageFallback = <Skeleton className="h-screen w-full rounded-none" />

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={pageFallback}>
              <Routes>
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/"          element={<Navigate to="/kanban" replace />} />
                    <Route path="/kanban"    element={<KanbanPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/campaigns" element={<CampaignsPage />} />
                    <Route path="/settings"  element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  )
}
