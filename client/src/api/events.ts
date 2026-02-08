import { format } from 'date-fns'

import type { EventCollection, EventsQuery, EventTypeMap } from '@/types/event'
import type { EventFilters } from '@/types/filter'

import { fetchApi } from './client'

export function fetchEvents(query: EventsQuery, signal?: AbortSignal) {
  const { bbox, filters } = query

  return fetchApi<EventCollection>(
    `/events?bbox=${bbox.join(',')}&${filtersToAPIParams(filters)}`,
    signal
  )
}

export function fetchEventTypes() {
  return fetchApi<EventTypeMap>(`/types`)
}

function filtersToAPIParams(filters: EventFilters): URLSearchParams {
  const { dateRange, eventTypes } = filters

  const params = new URLSearchParams({
    date_from: format(dateRange.from, 'yyyy-MM-dd'),
    date_to: format(dateRange.to, 'yyyy-MM-dd'),
  })

  // Generate array parameters: ?type[]=Protests&type[]=Riots
  eventTypes.forEach((type: string) => params.append('type[]', type))

  return params
}
