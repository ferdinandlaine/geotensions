/* eslint-disable react-refresh/only-export-components */
import { createContext, type PropsWithChildren, useContext, useState } from 'react'

import { clearToken, getToken, setToken } from '@/api/client'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(getToken() !== null)

  const login = (token: string) => {
    setIsAuthenticated(true)
    setToken(token)
  }

  const logout = () => {
    setIsAuthenticated(false)
    clearToken()
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider, useAuth }
