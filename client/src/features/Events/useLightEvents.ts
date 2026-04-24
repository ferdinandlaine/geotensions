import { skipToken, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getEvents } from '@/api/events'
import type { BBox, EventsQuery } from '@/types/event'
import { useFilters } from '@/contexts/FiltersContext'
import { useMap } from '@/contexts/MapContext'
import { useThrottled } from '@/hooks/useThrottled'
import { normalizeBbox } from '@/features/Map/normalizeBbox'

/** Throttle interval during map movement (ms) */
const MOVE_THROTTLE_MS = 100

/** Maximum events for the light layer */
const LIGHT_LIMIT = 150

/** Snap bbox outward to a grid so small pans reuse the same query cache */
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

export function useLightEvents() {
  const { map, zoom } = useMap()
  // Use live bounds from map 'move' events during movement (MapContext only updates on 'moveend')
  const liveBounds = useLiveBounds(map)
  const { dateRange, eventTypes: types } = useFilters()

  // Track whether the map is actively moving
  const isMoving = useIsMoving(map)

  // Throttle the bbox during movement
  const throttledBbox = isMoving && liveBounds ? snapBbox(normalizeBbox(liveBounds), 2) : undefined
  const throttledBboxValue = useThrottled(throttledBbox, MOVE_THROTTLE_MS)

  let query: EventsQuery | undefined
  if (throttledBboxValue && zoom !== null) {
    query = {
      bbox: throttledBboxValue,
      filters: { dateRange, types },
      fields: [],
      limit: LIGHT_LIMIT,
    }
  }

  return useQuery({
    queryKey: ['light-events', query],
    queryFn: query ? ({ signal }) => getEvents(query, { signal }) : skipToken,
    placeholderData: (previousData) => previousData,
    gcTime: 30000,
    enabled: !!query,
  })
}

/**
 * Subscribe to the map's `movestart` and `moveend` events to track active movement.
 * Returns true while the map is in a move cycle.
 */
function useIsMoving(map: import('maplibre-gl').Map | null): boolean {
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    if (!map) return

    const onStart = () => setMoving(true)
    const onEnd = () => setMoving(false)

    map.on('movestart', onStart)
    map.on('moveend', onEnd)

    return () => {
      map.off('movestart', onStart)
      map.off('moveend', onEnd)
    }
  }, [map])

  return moving
}

/**
 * Subscribe to the map's `move` events to get live bounds during movement.
 * Falls back to `null` when map is null.
 */
function useLiveBounds(map: import('maplibre-gl').Map | null): import('maplibre-gl').LngLatBounds | null {
  const [liveBounds, setLiveBounds] = useState<import('maplibre-gl').LngLatBounds | null>(null)

  useEffect(() => {
    if (!map) return

    const handleMove = () => setLiveBounds(map.getBounds())
    map.on('move', handleMove)

    return () => {
      map.off('move', handleMove)
    }
  }, [map])

  return liveBounds
}
