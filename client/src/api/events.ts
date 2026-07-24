import { format } from 'date-fns'

import type { EventCollection, EventsQuery, EventTypeMap } from '@/types/event'

import { fetchApi, request } from './client'

interface EventsResponse {
  data: EventCollection
  lastModified: string
}

export async function getEvents(
  query: EventsQuery,
  options?: { ifModifiedSince?: string; signal?: AbortSignal }
): Promise<EventsResponse | null> {
  const headers = options?.ifModifiedSince
    ? new Headers({ 'If-Modified-Since': options.ifModifiedSince })
    : undefined
  const response = await fetchApi(`events?${toParams(query)}`, { headers, signal: options?.signal })

  if (response.status === 304) return null

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const lastModified = response.headers.get('Last-Modified')
  if (!lastModified) throw new Error('Missing Last-Modified header')

  return { data: await response.json(), lastModified }
}

export function getEventTypes() {
  return request<EventTypeMap>('types')
}

function toParams(query: EventsQuery): URLSearchParams {
  const { bbox, filters, fields, limit } = query

  const params = new URLSearchParams({
    bbox: bbox.join(','),
    date_from: format(filters.dateRange.from, 'yyyy-MM-dd'),
    date_to: format(filters.dateRange.to, 'yyyy-MM-dd'),
  })

  if (filters.types.length) params.set('types', filters.types.join(','))
  if (fields) params.set('fields', fields.join(','))
  if (limit) params.set('limit', String(limit))

  return params
}
