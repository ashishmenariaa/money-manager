import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export function GuestOnly() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return accessToken ? <Navigate to="/dashboard" replace /> : <Outlet />
}
