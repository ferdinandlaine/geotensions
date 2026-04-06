import { LngLatBounds, type LngLatBoundsLike } from 'maplibre-gl'

import { MAP_CONFIG } from '@/config/map'
import { useMap } from '@/contexts/MapContext'

/** Returns true if the viewport spans the full width or height of maxBounds,
 * meaning zooming out further would exceed the map boundaries. */
function isViewportSpanningMaxBounds(
  bounds: LngLatBounds,
  maxBoundsLike: LngLatBoundsLike
): boolean {
  const maxBounds = LngLatBounds.convert(maxBoundsLike)
  const boundsEdgeTolerance = 0.001
  const touchesWest = bounds.getWest() <= maxBounds.getWest() + boundsEdgeTolerance
  const touchesEast = bounds.getEast() >= maxBounds.getEast() - boundsEdgeTolerance
  const touchesSouth = bounds.getSouth() <= maxBounds.getSouth() + boundsEdgeTolerance
  const touchesNorth = bounds.getNorth() >= maxBounds.getNorth() - boundsEdgeTolerance

  return (touchesWest && touchesEast) || (touchesSouth && touchesNorth)
}

export function useZoomConstraints() {
  const { bounds, zoom } = useMap()
  if (!bounds || zoom === null) return { canZoomIn: false, canZoomOut: false }

  return {
    canZoomIn: zoom < MAP_CONFIG.MAX_ZOOM,
    canZoomOut:
      zoom > MAP_CONFIG.MIN_ZOOM && !isViewportSpanningMaxBounds(bounds, MAP_CONFIG.MAX_BOUNDS),
  }
}
