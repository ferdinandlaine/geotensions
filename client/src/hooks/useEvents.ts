import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events'
import type { EventFilter } from '@/types/event'

export default function (params: EventFilter) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => fetchEvents(params),
  })
}
