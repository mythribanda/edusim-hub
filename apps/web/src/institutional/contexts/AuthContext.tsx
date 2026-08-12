import { createContext, useContext, useState } from 'react'

export type UserRole = 'student' | 'faculty' | 'admin' | 'government' | 'parent';

const AuthContext = createContext<any>({
  user: {
    id: 'demo-1',
    email: 'student@edusim.com',
    role: 'student',
    name: 'Demo Student',
    age_group: 'teen',
    profile: { full_name: 'Demo Student', role: 'student' },
    isAdmin: false,
  },
  isLoading: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState({
    id: 'demo-1',
    email: 'student@edusim.com',
    role: 'student',
    name: 'Demo Student',
    age_group: 'teen',
    profile: { full_name: 'Demo Student', role: 'student' },
    isAdmin: false,
  })

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        login: async () => {},
        logout: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}