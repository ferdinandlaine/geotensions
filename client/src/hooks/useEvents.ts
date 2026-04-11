import { useQuery } from '@tanstack/react-query'

import { getEvents } from '@/api/events'
import type { EventsQuery } from '@/types/event'

export function useEvents(query: EventsQuery | undefined) {
  return useQuery({
    queryKey: ['events', query],
    queryFn: ({ signal }) => {
      if (!query) throw new Error('Query is not defined!')
      return getEvents(query, { signal })
    },
    enabled: !!query,
    placeholderData: (previousData) => previousData,
  })
}
