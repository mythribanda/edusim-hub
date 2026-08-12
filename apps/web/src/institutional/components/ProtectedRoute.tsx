import { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  // Bypass auth for demo — always render children
  return <>{children}</>
}

export default ProtectedRoute;