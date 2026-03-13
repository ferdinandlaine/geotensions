import { IconAlertCircle, IconLogin2 } from '@tabler/icons-react'
import { type FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { postApi } from '@/api/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState(searchParams.get('u') || '')
  const [password, setPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { token } = await postApi<{ token: string }>('login', { username, password })

      login(token)
      document.startViewTransition(() => {
        navigate('/', { replace: true })
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'unknown error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center px-8">
      <form
        onSubmit={handleSubmit}
        className="bg-background/75 border-accent flex w-72 flex-col gap-4 rounded-lg border p-8 backdrop-blur-xs"
      >
        <h1 className="mb-2 text-center text-2xl font-semibold">Login</h1>

        {error && (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          readOnly={!!searchParams.get('u')}
          disabled={isSubmitting}
          required
        />

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={isSubmitting}
          required
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            <>
              <IconLogin2 />
              Sign in
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

export default LoginPage
