import { fetchApi } from './client'
import type { EventCollection } from '@/types/event'
import type { EventFilter } from '@/types/event'

export function fetchEvents(filter: EventFilter) {
  return fetchApi<EventCollection>(`/events?${toApiParams(filter)}`)
}

function toApiParams(filter: EventFilter): URLSearchParams {
  const { bbox, dateFrom, dateTo } = filter
  const params = new URLSearchParams({
    bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
    date_from: dateFrom.toISOString().split('T')[0],
    date_to: dateTo.toISOString().split('T')[0],
  })

  // Generate array parameters: ?type[]=Protests&type[]=Riots
  filter.types?.forEach((type: string) => params.append('type[]', type))

  return params
}
