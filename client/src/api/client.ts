import { getToken, removeToken } from '@/lib/token'

const API_URL = import.meta.env.VITE_API_URL

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const response = await fetch(`${API_URL}/${endpoint}`, { headers, ...options })

  if (response.status === 401) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export { request }
