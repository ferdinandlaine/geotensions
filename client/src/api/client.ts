const BASE_URL = import.meta.env.VITE_API_URL

export async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)))
    } else {
      searchParams.append(key, String(value))
    }
  }

  const qs = searchParams.toString()
  return qs && `?${qs}`
}
