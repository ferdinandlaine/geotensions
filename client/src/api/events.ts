import type { EventCollection, EventFilter, EventsQuery } from '@/types/event'

import { fetchApi } from './client'

export function fetchEvents(query: EventsQuery, signal?: AbortSignal) {
  const { bbox, filter } = query

  return fetchApi<EventCollection>(
    `/events?bbox=${bbox.join(',')}&${filterToParams(filter)}`,
    signal
  )
}

function filterToParams(filter: EventFilter): URLSearchParams {
  const { dateFrom, dateTo, types } = filter

  const params = new URLSearchParams({
    date_from: dateFrom.toISOString().split('T')[0],
    date_to: dateTo.toISOString().split('T')[0],
  })

  // Generate array parameters: ?type[]=Protests&type[]=Riots
  types?.forEach((type: string) => params.append('type[]', type))

  return params
}
