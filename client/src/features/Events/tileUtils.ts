import { format } from 'date-fns'
import type { LngLatBounds } from 'maplibre-gl'

import { MAP_CONFIG } from '@/config/map'
import type { BBox } from '@/types/event'
import type { EventFilters } from '@/types/filter'

interface ZoomLevel {
  name: 'world' | 'overview' | 'detail'
  tileSizeDeg: number
  prefetchRing: number
  fields: string[]
  limit: number
}

const ZOOM_LEVELS: Record<string, ZoomLevel> = {
  world: {
    name: 'world',
    tileSizeDeg: 90,
    prefetchRing: 0,
    fields: [],
    limit: 5000,
  },
  overview: {
    name: 'overview',
    tileSizeDeg: 10,
    prefetchRing: 1,
    fields: [],
    limit: 10000,
  },
  detail: {
    name: 'detail',
    tileSizeDeg: 0.5,
    prefetchRing: 1,
    fields: ['date', 'type', 'sub_type', 'actor1', 'actor2'],
    limit: 20000,
  },
}

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom <= 4) return ZOOM_LEVELS.world
  if (zoom < MAP_CONFIG.DETAIL_ZOOM_THRESHOLD) return ZOOM_LEVELS.overview
  return ZOOM_LEVELS.detail
}

function toFiltersKey(filters: EventFilters): string {
  const { dateRange, types } = filters
  const sortedTypes = [...types].sort().join(',')
  return `${format(dateRange.from, 'yyyy-MM-dd')}|${format(dateRange.to, 'yyyy-MM-dd')}|${sortedTypes}`
}

function toTileKey(level: string, filtersKey: string, x: number, y: number): string {
  return `${level}|${filtersKey}|${x}|${y}`
}

export interface Tile {
  key: string
  bbox: BBox
  fields: string[]
  limit: number
}

export function getTiles(bounds: LngLatBounds, zoom: number, filters: EventFilters): Tile[] {
  const bbox: BBox = [
    Math.max(bounds.getWest(), -180),
    Math.max(bounds.getSouth(), -90),
    Math.min(bounds.getEast(), 180),
    Math.min(bounds.getNorth(), 90),
  ]
  const level = getZoomLevel(zoom)
  const filtersKey = toFiltersKey(filters)
  const tileSize = level.tileSizeDeg

  const buffer = level.prefetchRing * tileSize
  const expanded: BBox = [bbox[0] - buffer, bbox[1] - buffer, bbox[2] + buffer, bbox[3] + buffer]
  const startX = Math.floor(expanded[0] / tileSize)
  const endX = Math.floor(expanded[2] / tileSize)
  const startY = Math.floor(expanded[1] / tileSize)
  const endY = Math.floor(expanded[3] / tileSize)

  const tiles: Tile[] = []
  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const west = Math.max(x * tileSize, -180)
      const south = Math.max(y * tileSize, -90)
      const east = Math.min((x + 1) * tileSize, 180)
      const north = Math.min((y + 1) * tileSize, 90)
      if (west >= east || south >= north) continue

      tiles.push({
        key: toTileKey(level.name, filtersKey, x, y),
        bbox: [west, south, east, north],
        fields: level.fields,
        limit: level.limit,
      })
    }
  }

  return tiles
}
