import { fetchApi } from './client'
import type { EventCollection, EventsQuery, EventFilter } from '@/types/event'

export function fetchEvents(query: EventsQuery) {
  const { bbox, filter } = query
  const bboxString = bbox.toArray().flat().join(',')
  return fetchApi<EventCollection>(`/events?bbox=${bboxString}&${toFilterParams(filter)}`)
}

function toFilterParams(filter: EventFilter): URLSearchParams {
  const { dateFrom, dateTo, types } = filter

  const params = new URLSearchParams({
    date_from: dateFrom.toISOString().split('T')[0],
    date_to: dateTo.toISOString().split('T')[0],
  })

  // Generate array parameters: ?type[]=Protests&type[]=Riots
  types?.forEach((type: string) => params.append('type[]', type))

  return params
}
