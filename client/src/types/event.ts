export interface Event {
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
  features: Event[]
  is_truncated: boolean
  total_count: number
}

/**
 * Bounding box coordinates in [west, south, east, north] format.
 * Corresponds to API format: bbox=minLon,minLat,maxLon,maxLat
 */
export type BBox = [west: number, south: number, east: number, north: number]

export interface EventsQuery {
  bbox: BBox
  filter: EventFilter
}

export interface EventFilter {
  dateFrom: Date
  dateTo: Date
  types: string[]
}
