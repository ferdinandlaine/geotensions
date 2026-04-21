import type { EventFilters } from './filter'

export interface EventFeature {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    date?: string
    type?: string
    sub_type?: string
    disorder_type?: string
    actor1?: string
    actor2?: string
    inter1?: string
    inter2?: string
    assoc_actor_1?: string
    assoc_actor_2?: string
    iso?: number
    region?: string
    country?: string
    admin1?: string
    admin2?: string
    admin3?: string
    location?: string
    geo_precision?: number
    civilian_targeting?: boolean
    fatalities?: number
    source?: string
    source_scale?: string
    notes?: string
    tags?: string
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
  /**
   * Fields to include in event properties.
   * - ['date', 'type'] → specific fields only
   * - [] → geometry only, no properties
   * - undefined → all fields
   */
  fields?: string[]
  limit?: number
}
