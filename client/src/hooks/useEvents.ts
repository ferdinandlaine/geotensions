import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events'
import type { EventFilter } from '@/types/event'

export default function (filter: EventFilter | undefined) {
  return useQuery({
    queryKey: ['events', filter],
    queryFn: () => fetchEvents(filter!),
    enabled: !!filter,
  })
}
