import type { EventFilters } from './filter'

export interface EventFeature {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    type: string
    sub_type: string
    date: string
  }
}

export interface EventCollection {
  type: 'FeatureCollection'
  features: EventFeature[]
  is_truncated: boolean
}

export type EventTypeMap = Record<string, string[]>

/**
 * Bounding box coordinates in [west, south, east, north] format.
 * Corresponds to API format: bbox=minLon,minLat,maxLon,maxLat
 */
export type BBox = [west: number, south: number, east: number, north: number]

export interface EventsQuery {
  bbox: BBox
  filters: EventFilters
}
