import { LngLatBounds } from 'maplibre-gl'

import { MAP_CONFIG } from '@/config/map'
import { useMap } from '@/contexts/MapContext'

/** Returns true if the viewport spans the full width or height of maxBounds,
 * meaning MapLibre is preventing further zoom-out */
export function isViewportSpanningMaxBounds(bounds: LngLatBounds): boolean {
  const maxBounds = LngLatBounds.convert(MAP_CONFIG.MAX_BOUNDS)

  // Small relative tolerance (0.01%) to absorb floating-point imprecision
  // accumulated by MapLibre's internal projection/unprojection transforms
  const lonTolerance = (maxBounds.getEast() - maxBounds.getWest()) * 0.0001
  const latTolerance = (maxBounds.getNorth() - maxBounds.getSouth()) * 0.0001

  const spansWidth =
    bounds.getWest() <= maxBounds.getWest() + lonTolerance &&
    bounds.getEast() >= maxBounds.getEast() - lonTolerance
  const spansHeight =
    bounds.getSouth() <= maxBounds.getSouth() + latTolerance &&
    bounds.getNorth() >= maxBounds.getNorth() - latTolerance

  return spansWidth || spansHeight
}

export function useZoomConstraints() {
  const { bounds, zoom } = useMap()

  if (!bounds || zoom === null) {
    return {
      canZoomIn: false,
      canZoomOut: false,
    }
  }

  return {
    canZoomIn: zoom < MAP_CONFIG.MAX_ZOOM,
    canZoomOut: zoom > MAP_CONFIG.MIN_ZOOM && !isViewportSpanningMaxBounds(bounds),
  }
}
