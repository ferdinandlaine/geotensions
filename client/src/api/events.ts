import { buildQueryString, fetchApi } from './client'
import type { EventCollection } from '@/types/event'
import type { EventFilter } from '@/types/api'

export function fetchEvents(params: EventFilter) {
  return fetchApi<EventCollection>(`/events${buildQueryString(params)}`)
}
