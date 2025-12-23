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
