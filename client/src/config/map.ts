import type { LngLatBoundsLike } from 'maplibre-gl'

export const MAP_CONFIG = {
  MAX_BOUNDS: [
    // World
    [-179.99, -65],
    [180, 85],

    // France
    // [-5.5, 41],
    // [10, 51.5],
  ] as LngLatBoundsLike,
  INITIAL_VIEW_STATE: {
    longitude: 2.35 as number,
    latitude: 48.85 as number,
  },
  INITIAL_ZOOM: 4 as number,
  MIN_ZOOM: 1 as number,
  MAX_ZOOM: 14 as number,
} as const
