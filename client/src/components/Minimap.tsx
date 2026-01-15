import { useCallback, useEffect, useRef } from 'react'
import {
  Map,
  type MapMouseEvent,
  type MapRef,
  type StyleSpecification,
} from 'react-map-gl/maplibre'
import {
  LngLatBounds,
  MercatorCoordinate,
  type GeoJSONSource,
  type LngLatBoundsLike,
} from 'maplibre-gl'
import minimap from '@/assets/map-styles/minimap.json'
import { MAP_CONFIG } from '@/config/map'
import { useDragBehavior } from '@/hooks/useDragBehavior'

/**
 * Calculate aspect ratio for a bounding box in Mercator projection
 * Uses MapLibre's native MercatorCoordinate for accurate conversion
 * This accounts for the non-linear latitude scaling in Web Mercator
 *
 * @param boundsLike - Any valid LngLatBoundsLike format
 * @throws Error if boundsLike cannot be converted to LngLatBounds
 */
function calculateMercatorAspectRatio(boundsLike: LngLatBoundsLike): number {
  let bounds: LngLatBounds

  try {
    // Use MapLibre's convert method which handles all LngLatBoundsLike formats
    bounds = LngLatBounds.convert(boundsLike)
  } catch (error) {
    throw new Error(
      `Invalid bounds: ${error instanceof Error ? error.message : 'unknown error'}. ` +
        `Received: ${JSON.stringify(boundsLike)}`
    )
  }

  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  // Convert geographic coordinates to Mercator coordinates (0-1 range)
  const swMercator = MercatorCoordinate.fromLngLat(sw)
  const neMercator = MercatorCoordinate.fromLngLat(ne)

  // Calculate deltas (abs because y decreases northward in Mercator)
  const deltaX = neMercator.x - swMercator.x
  const deltaY = Math.abs(neMercator.y - swMercator.y)

  // Return width/height ratio
  return deltaX / deltaY
}

interface Props {
  viewportBounds: LngLatBounds | null
  onNavigate: (lng: number, lat: number) => void
  onDrag?: (lng: number, lat: number) => void
}

// Calculate aspect ratio based on Mercator projection
const aspectRatio = calculateMercatorAspectRatio(MAP_CONFIG.MAX_BOUNDS)

export function Minimap({ viewportBounds, onNavigate, onDrag }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<MapRef>(null)
  const dragOffsetRef = useRef<{ lng: number; lat: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap || !viewportBounds) return

    const viewportRectangleSource = minimap.getSource('viewport-bounds') as GeoJSONSource
    const viewportPointSource = minimap.getSource('viewport-point') as GeoJSONSource
    if (!viewportRectangleSource || !viewportPointSource) return

    // Cancel any pending update
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    // Schedule update on next animation frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null

      // Extract bounds coordinates
      const sw = viewportBounds.getSouthWest()
      const ne = viewportBounds.getNorthEast()
      const center = viewportBounds.getCenter()

      // Calculate viewport size in pixels to determine if we show point or rectangle
      const swPx = minimap.project([sw.lng, sw.lat])
      const nePx = minimap.project([ne.lng, ne.lat])
      const width = Math.abs(nePx.x - swPx.x)
      const height = Math.abs(nePx.y - swPx.y)
      const minViewportSize = Math.min(width, height)

      // If viewport is too small (< 5px), show a point instead of rectangle
      const showPoint = minViewportSize < 5

      // Update geometries
      if (showPoint) {
        viewportPointSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat],
          },
        })
      } else {
        viewportRectangleSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [sw.lng, sw.lat],
                [ne.lng, sw.lat],
                [ne.lng, ne.lat],
                [sw.lng, ne.lat],
                [sw.lng, sw.lat],
              ],
            ],
          },
        })
      }

      // Update visibility
      const rectangleVisibility = showPoint ? 'none' : 'visible'
      const pointVisibility = showPoint ? 'visible' : 'none'

      minimap.setLayoutProperty('viewport-fill', 'visibility', rectangleVisibility)
      minimap.setLayoutProperty('viewport-outline', 'visibility', rectangleVisibility)
      minimap.setLayoutProperty('viewport-point', 'visibility', pointVisibility)
    })

    // Cleanup function
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [viewportBounds])

  // Click handler for simple clicks
  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      onNavigate(e.lngLat.lng, e.lngLat.lat)
    },
    [onNavigate]
  )

  // Drag behavior for dragging the viewport
  // Uses 5px threshold to distinguish clicks from intentional drags
  // Implements "grab anywhere inside viewport" - clicking inside viewport drags from that point
  // Clicking outside viewport centers the viewport on the click point
  useDragBehavior(
    containerRef,
    {
      onStart: (event) => {
        const map = minimapRef.current?.getMap()
        if (!map || !viewportBounds || !onDrag) return

        const clickLngLat = map.unproject([event.x, event.y])
        const sw = viewportBounds.getSouthWest()
        const ne = viewportBounds.getNorthEast()

        // Check if click is inside viewport bounds
        const isInsideViewport =
          clickLngLat.lng >= sw.lng &&
          clickLngLat.lng <= ne.lng &&
          clickLngLat.lat >= sw.lat &&
          clickLngLat.lat <= ne.lat

        if (isInsideViewport) {
          // Store offset between viewport center and click point
          dragOffsetRef.current = {
            lng: (sw.lng + ne.lng) / 2 - clickLngLat.lng,
            lat: (sw.lat + ne.lat) / 2 - clickLngLat.lat,
          }
        } else {
          // No offset - viewport will center on cursor
          dragOffsetRef.current = { lng: 0, lat: 0 }
        }
      },
      onDrag: (event) => {
        const map = minimapRef.current?.getMap()
        if (!map || !onDrag || !dragOffsetRef.current) return

        const lngLat = map.unproject([event.x, event.y])
        onDrag(lngLat.lng + dragOffsetRef.current.lng, lngLat.lat + dragOffsetRef.current.lat)
      },
      onEnd: () => {
        dragOffsetRef.current = null
      },
    },
    [onDrag, viewportBounds],
    { threshold: 5 }
  )

  const handleLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return

    minimap.fitBounds(MAP_CONFIG.MAX_BOUNDS, { animate: false, padding: -1 })

    // Viewport rectangle source and layers
    minimap.addSource('viewport-bounds', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
      },
    })

    minimap.addLayer({
      id: 'viewport-fill',
      type: 'fill',
      source: 'viewport-bounds',
      layout: {
        visibility: 'visible',
      },
      paint: {
        'fill-color': '#a3a3a3',
        'fill-opacity': 0.1,
      },
    })

    minimap.addLayer({
      id: 'viewport-outline',
      type: 'line',
      source: 'viewport-bounds',
      layout: {
        visibility: 'visible',
      },
      paint: {
        'line-color': '#a3a3a3',
        'line-width': 1,
        'line-opacity': 0.5,
      },
    })

    // Viewport point source and layer (shown when zoomed out)
    minimap.addSource('viewport-point', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      },
    })

    minimap.addLayer({
      id: 'viewport-point',
      type: 'circle',
      source: 'viewport-point',
      layout: {
        visibility: 'none',
      },
      paint: {
        'circle-radius': 3,
        'circle-color': '#a3a3a3',
        'circle-opacity': 0.75,
      },
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className="card h-40 cursor-grab active:cursor-grabbing"
      style={{ aspectRatio, touchAction: 'none' }}
    >
      <Map
        ref={minimapRef}
        mapStyle={minimap as unknown as StyleSpecification}
        interactive={false}
        maxBounds={MAP_CONFIG.MAX_BOUNDS}
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleLoad}
        onClick={handleClick}
      />
    </div>
  )
}
