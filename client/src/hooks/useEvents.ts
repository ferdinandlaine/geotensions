import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events'
import type { EventFilter } from '@/types/api'

export default function (params: EventFilter) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => fetchEvents(params),
  })
}
