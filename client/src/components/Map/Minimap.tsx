import {
  type GeoJSONSource,
  LngLatBounds,
  type LngLatBoundsLike,
  MercatorCoordinate,
} from 'maplibre-gl'
import { useCallback, useEffect, useRef } from 'react'
import { Map, type MapRef, type StyleSpecification } from 'react-map-gl/maplibre'

import minimap from '@/assets/map-styles/minimap.json'
import { MAP_CONFIG } from '@/config/map'
import { THEME } from '@/config/theme'
import { useDrag } from '@/hooks/useDrag'

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

  return deltaX / deltaY
}

interface Props {
  viewportBounds: LngLatBounds | null
  canZoomIn: boolean
  canZoomOut: boolean
  onClick: (lng: number, lat: number) => void
  onDrag: (lng: number, lat: number) => void
  onZoom: (zoomDelta: number) => void
}

const aspectRatio = calculateMercatorAspectRatio(MAP_CONFIG.MAX_BOUNDS)
const RECTANGLE_MIN_SIZE = 4 // threshold below which rectangle is too small

function Minimap({ viewportBounds, onClick, onDrag }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<MapRef>(null)

  // Convert D3 drag event coordinates to geographic coordinates
  const eventToLngLat = useCallback((event: { x: number; y: number }) => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return null

    return minimap.unproject([event.x, event.y])
  }, [])

  const handleDragStart = useCallback(
    (event: { x: number; y: number }) => {
      const lngLat = eventToLngLat(event)
      if (!lngLat) return
      onClick(lngLat.lng, lngLat.lat)
    },
    [eventToLngLat, onClick]
  )

  const handleDrag = useCallback(
    (event: { x: number; y: number }) => {
      const lngLat = eventToLngLat(event)
      if (!lngLat) return
      onDrag(lngLat.lng, lngLat.lat)
    },
    [eventToLngLat, onDrag]
  )

  useDrag(
    containerRef,
    {
      onStart: handleDragStart,
      onDrag: handleDrag,
    },
    {
      threshold: 5,
    }
  )

  const handleMapLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return

    minimap.fitBounds(MAP_CONFIG.MAX_BOUNDS, { animate: false, padding: -1 })

    minimap.addSource('viewport-bounds', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
            ],
          ],
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
        'fill-color': THEME.minimapViewport.rectangle.fill,
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
        'line-color': THEME.minimapViewport.rectangle.stroke,
        'line-width': 1,
      },
    })

    minimap.addSource('viewport-point', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
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
        'circle-color': THEME.minimapViewport.point.fill,
        'circle-radius': 3,
      },
    })
  }, [])

  useEffect(() => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap || !viewportBounds) return

    const sw = viewportBounds.getSouthWest()
    const ne = viewportBounds.getNorthEast()
    const center = viewportBounds.getCenter()

    // Update rectangle source
    const rectangleSource = minimap.getSource('viewport-bounds') as GeoJSONSource
    if (!rectangleSource) return

    rectangleSource.setData({
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

    // Update point source
    const pointSource = minimap.getSource('viewport-point') as GeoJSONSource
    if (!pointSource) return

    pointSource.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [center.lng, center.lat],
      },
    })

    // Calculate viewport dimensions
    const swPx = minimap.project([sw.lng, sw.lat])
    const nePx = minimap.project([ne.lng, ne.lat])
    const widthPx = Math.abs(nePx.x - swPx.x)
    const heightPx = Math.abs(nePx.y - swPx.y)
    const minDimension = Math.min(widthPx, heightPx)

    // Toggle between point and rectangle based on size
    minimap.setLayoutProperty(
      'viewport-fill',
      'visibility',
      minDimension >= RECTANGLE_MIN_SIZE ? 'visible' : 'none'
    )
    minimap.setLayoutProperty(
      'viewport-outline',
      'visibility',
      minDimension >= RECTANGLE_MIN_SIZE ? 'visible' : 'none'
    )
    minimap.setLayoutProperty(
      'viewport-point',
      'visibility',
      minDimension < RECTANGLE_MIN_SIZE ? 'visible' : 'none'
    )
  }, [viewportBounds])

  return (
    <div
      ref={containerRef}
      className="card w-48 cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ aspectRatio, touchAction: 'none' }}
    >
      <Map
        ref={minimapRef}
        mapStyle={minimap as unknown as StyleSpecification}
        interactive={false}
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleMapLoad}
      />
    </div>
  )
}

export default Minimap
