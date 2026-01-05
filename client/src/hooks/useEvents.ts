import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events'
import type { EventsQuery } from '@/types/event'

export default function (query: EventsQuery | undefined) {
  return useQuery({
    queryKey: ['events', query],
    queryFn: () => {
      if (!query) throw new Error('Query is not defined!')
      return fetchEvents(query)
    },
    enabled: !!query,
  })
}
