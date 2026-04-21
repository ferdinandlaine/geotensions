import { skipToken, useQuery } from '@tanstack/react-query'

import { getEvents } from '@/api/events'
import { MAP_CONFIG } from '@/config/map'
import { useFilters } from '@/contexts/FiltersContext'
import { useMap } from '@/contexts/MapContext'
import { normalizeBbox } from '@/features/Map/normalizeBbox'
import type { BBox, EventsQuery } from '@/types/event'

/** Snap bbox outward to a grid so that small pans reuse the same cache entry and prefetch edges */
function snapBbox(bbox: BBox, precision: number): BBox {
  const snap = (n: number, op: (x: number) => number) =>
    op(Number((n * precision).toFixed(10))) / precision
  return [
    snap(bbox[0], Math.floor),
    snap(bbox[1], Math.floor),
    snap(bbox[2], Math.ceil),
    snap(bbox[3], Math.ceil),
  ]
}

export function useEvents() {
  const { bounds, zoom } = useMap()
  const { dateRange, eventTypes: types } = useFilters()

  let query: EventsQuery | undefined
  if (bounds && zoom !== null) {
    const isDetailed = zoom > MAP_CONFIG.DETAIL_ZOOM_THRESHOLD
    const bbox = normalizeBbox(bounds)

    query = {
      bbox: isDetailed ? snapBbox(bbox, 10) : snapBbox(bbox, 1),
      filters: { dateRange, types },
      fields: isDetailed ? ['date', 'type', 'sub_type', 'actor1', 'actor2'] : [],
      limit: isDetailed ? 5000 : 20000,
    }
  }

  return useQuery({
    queryKey: ['events', query],
    queryFn: query ? ({ signal }) => getEvents(query, { signal }) : skipToken,
    placeholderData: (previousData) => previousData,
    gcTime: 60000,
  })
}
