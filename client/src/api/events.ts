import { fetchApi } from './client'
import type { EventCollection } from '@/types/event'
import type { EventFilter } from '@/types/event'

export function fetchEvents(params: EventFilter) {
  return fetchApi<EventCollection>(`/events?${toApiParams(params)}`)
}

function toApiParams(filter: EventFilter): URLSearchParams {
  const params = new URLSearchParams({
    date_from: filter.dateFrom.toISOString().split('T')[0],
    date_to: filter.dateTo.toISOString().split('T')[0],
  })

  // Add multiple types parameters: ?type=Protests&type=Riots
  filter.types?.forEach((type: string) => params.append('type', type))

  return params
}
