import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasHydrated || isLoading) return
    
    if (!isAuthenticated) {
      navigate({ to: '/login' as any })
      return
    }
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      navigate({ to: '/unauthorized' as any })
    }
  }, [isAuthenticated, isLoading, hasHydrated, user, allowedRoles, navigate])

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
