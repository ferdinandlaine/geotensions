import type { LngLatBoundsLike } from 'maplibre-gl'

export const MAP_CONFIG = {
  MAX_BOUNDS: [
    [-179.99, -65], // -179.99 avoids rendering bug at the antimeridian
    [180, 85],
  ] as LngLatBoundsLike,
  INITIAL_VIEW_STATE: {
    longitude: 2.35 as number,
    latitude: 48.85 as number,
  },
  INITIAL_ZOOM: 4 as number,
  MIN_ZOOM: 1 as number,
  MAX_ZOOM: 14 as number,
} as const
