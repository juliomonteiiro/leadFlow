import { Navigate, Outlet } from 'react-router-dom'
import { useWorkspace }      from '@/hooks/useWorkspace'
import { Skeleton }          from '@/components/ui/Skeleton'

export function ProtectedRoute() {
  const { user, loading } = useWorkspace()
  if (loading) return <Skeleton className="h-screen w-full rounded-none" />
  if (!user)   return <Navigate to="/login" replace />
  return <Outlet />
}
