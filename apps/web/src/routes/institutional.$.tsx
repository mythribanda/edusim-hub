import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect, Component, type ReactNode } from 'react'
import { AuthProvider } from '@/institutional/contexts/AuthContext'

// Direct imports — no lazy
import LoginSelector from '@/institutional/pages/LoginSelector'
import StudentLogin from '@/institutional/pages/login/StudentLogin'
import StudentDashboard from '@/institutional/pages/dashboard/StudentDashboard'
import StudentAttendance from '@/institutional/pages/attendance/StudentAttendance'
import FacultyDashboard from '@/institutional/pages/dashboard/FacultyDashboard'
import FacultyAttendance from '@/institutional/pages/attendance/FacultyAttendance'
import AdminDashboard from '@/institutional/pages/dashboard/AdminDashboard'
import AdminAttendance from '@/institutional/pages/attendance/AdminAttendance'

export const Route = createFileRoute('/institutional/$')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: '/institutional/$' })
  const path = params._splat || ''
  const normalized = path.replace(/^\/+|\/+$/g, '')

  return (
    <AuthProvider>
      <ErrorBoundary>
        <InnerRoute path={normalized} />
      </ErrorBoundary>
    </AuthProvider>
  )
}

function InnerRoute({ path }: { path: string }) {
  switch (path) {
    case 'login/student': return <StudentLogin />
    case 'login/faculty': return <StudentLogin />
    case 'login/admin': return <StudentLogin />
    case 'dashboard/student': return <StudentDashboard />
    case 'dashboard/faculty': return <FacultyDashboard />
    case 'dashboard/admin': return <AdminDashboard />
    case 'attendance/student': return <StudentAttendance />
    case 'attendance/faculty': return <FacultyAttendance />
    case 'attendance/admin': return <AdminAttendance />
    default: return <LoginSelector />
  }
}

// Proper React ErrorBoundary — catches render crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Institutional render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui' }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
