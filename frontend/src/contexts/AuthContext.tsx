import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser } from '../types'
import { api, getAccessToken } from '../services/api'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing token on mount
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    api.getMe()
      .then((u) => setUser(u))
      .catch(() => {
        api.logout()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.login(email, password)
    setUser(tokens.user)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const tokens = await api.register(email, password, displayName)
    setUser(tokens.user)
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
