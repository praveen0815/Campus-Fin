import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-base font-medium text-slate-700 sm:text-lg transition-colors duration-300">
        Checking session...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    const fallback = profile?.role === 'admin' ? '/admin' : '/student/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

