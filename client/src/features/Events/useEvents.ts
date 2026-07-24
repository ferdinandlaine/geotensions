import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { useFilters } from '@/contexts/FiltersContext'
import { useMap } from '@/contexts/MapContext'
import type { EventCollection, EventFeature } from '@/types/event'

import { tileStore } from './tileStore'
import { getTiles } from './tileUtils'

export function useEvents(): {
  features: EventCollection | null
  isFetching: boolean
} {
  const { bounds, zoom, isSettled } = useMap()
  const { dateRange, eventTypes: types } = useFilters()

  const filters = useMemo(() => ({ dateRange, types }), [dateRange, types])

  const tiles = useMemo(() => {
    if (!bounds || zoom === null) return []
    return getTiles(bounds, zoom, filters)
  }, [bounds, zoom, filters])

  useEffect(() => {
    if (!tiles.length) return

    const controller = new AbortController()
    const activeKeys = new Set(tiles.map((t) => t.key))
    tileStore.prune(activeKeys)

    for (const tile of tiles) {
      tileStore.fetchTile({
        key: tile.key,
        bbox: tile.bbox,
        filters,
        fields: tile.fields,
        limit: tile.limit,
        signal: controller.signal,
        revalidate: isSettled,
      })
    }

    return () => controller.abort()
  }, [tiles, filters, isSettled])

  const snapshot = useSyncExternalStore(tileStore.subscribe, tileStore.getSnapshot)

  const result = useMemo(() => {
    if (!tiles.length) return { features: null, isFetching: false }

    // Deduplicate features by id since overlapping tiles may include the same event.
    const seen = new Set<string>()
    const features: EventFeature[] = []
    let isFetching = false
    let isTruncated = false

    for (const tile of tiles) {
      const data = tileStore.getData(tile.key)
      if (data) {
        for (const f of data.features) {
          if (seen.has(f.id)) continue
          seen.add(f.id)
          features.push(f)
        }
        if (data.isTruncated) isTruncated = true
      }
      if (tileStore.isLoading(tile.key)) isFetching = true
    }

    return {
      features: {
        type: 'FeatureCollection',
        features,
        is_truncated: isTruncated,
      } satisfies EventCollection,
      isFetching,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot tracks tileStore version bumps
  }, [snapshot, tiles])

  return result
}
