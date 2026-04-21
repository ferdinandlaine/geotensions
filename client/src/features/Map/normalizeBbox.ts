import type { LngLatBounds } from 'maplibre-gl'

import type { BBox } from '@/types/event'

export function normalizeBbox(bounds: LngLatBounds): BBox {
  const round = (n: number) => Math.round(n * 1e3) / 1e3

  return [
    round(Math.max(bounds.getWest(), -180)),
    round(Math.max(bounds.getSouth(), -90)),
    round(Math.min(bounds.getEast(), 180)),
    round(Math.min(bounds.getNorth(), 90)),
  ]
}
