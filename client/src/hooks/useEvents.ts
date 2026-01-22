import { useQuery } from '@tanstack/react-query'

import { fetchEvents } from '@/api/events'
import type { EventsQuery } from '@/types/event'

export function useEvents(query: EventsQuery | undefined) {
  return useQuery({
    queryKey: ['events', query],
    queryFn: ({ signal }) => {
      if (!query) throw new Error('Query is not defined!')
      return fetchEvents(query, signal)
    },
    enabled: !!query,
    placeholderData: (previousData) => previousData,
  })
}
