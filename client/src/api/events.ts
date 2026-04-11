import { format } from 'date-fns'

import type { EventCollection, EventsQuery, EventTypeMap } from '@/types/event'

import { request } from './client'

export function getEvents(query: EventsQuery, options?: { signal: AbortSignal }) {
  return request<EventCollection>(`events?${toParams(query)}`, options)
}

export function getEventTypes() {
  return request<EventTypeMap>(`types`)
}

function toParams(query: EventsQuery): URLSearchParams {
  const { bbox, filters } = query

  const params = new URLSearchParams({
    bbox: bbox.join(','),
    date_from: format(filters.dateRange.from, 'yyyy-MM-dd'),
    date_to: format(filters.dateRange.to, 'yyyy-MM-dd'),
  })

  // Generate array parameters: ?type[]=Protests&type[]=Riots
  filters.eventTypes.forEach((type) => params.append('type[]', type))

  return params
}
