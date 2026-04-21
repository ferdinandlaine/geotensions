import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

function RequireAuth({ children, flag = true }: PropsWithChildren<{ flag?: boolean }>) {
  const { isAuthenticated } = useAuth()

  if (flag && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!flag && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export { RequireAuth }
