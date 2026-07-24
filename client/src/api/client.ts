import { getToken, removeToken } from '@/lib/token'

const API_URL = import.meta.env.VITE_API_URL

export async function fetchApi(endpoint: string, options?: RequestInit): Promise<Response> {
  const token = getToken()
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  if (options?.headers) {
    for (const [key, value] of new Headers(options.headers)) {
      headers.set(key, value)
    }
  }

  const response = await fetch(`${API_URL}/${endpoint}`, { ...options, headers })

  if (response.status === 401) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return response
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetchApi(endpoint, options)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}
