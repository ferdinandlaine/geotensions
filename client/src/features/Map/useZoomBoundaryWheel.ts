import { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect } from 'react'

import { MAP_CONFIG } from '@/config/map'

import { isViewportSpanningMaxBounds } from './useZoomConstraints'

/**
 * Suppress wheel events at zoom boundaries to prevent MapLibre's
 * internal 200ms debounce from blocking subsequent moveEnd events.
 */
export function useZoomBoundaryWheel(map: MapLibreMap | null) {
  useEffect(() => {
    if (!map) return

    const container = map.getCanvasContainer()
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      const atZoomOutLimit =
        event.deltaY > 0 &&
        (map.getZoom() <= MAP_CONFIG.MIN_ZOOM || isViewportSpanningMaxBounds(map.getBounds()))
      const atZoomInLimit = event.deltaY < 0 && map.getZoom() >= MAP_CONFIG.MAX_ZOOM

      if (atZoomOutLimit || atZoomInLimit) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true })

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [map])
}
