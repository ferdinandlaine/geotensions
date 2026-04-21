import { LngLatBounds, MercatorCoordinate } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import {
  Layer,
  Map as ReactMapGL,
  type MapRef,
  Source,
  type StyleSpecification,
} from 'react-map-gl/maplibre'

import minimap from '@/assets/map-styles/minimap.json'
import { MAP_CONFIG } from '@/config/map'
import { useMap } from '@/contexts/MapContext'
import { type DragEvent, useDrag } from '@/hooks/useDrag'
import { useWheel } from '@/hooks/useWheel'

import { useZoomConstraints } from './useZoomConstraints'

// Pre-computed Mercator bounds (used for aspect ratio and viewport pixel size)
const maxBounds = LngLatBounds.convert(MAP_CONFIG.MAX_BOUNDS)
const maxBoundsSWMerc = MercatorCoordinate.fromLngLat(maxBounds.getSouthWest())
const maxBoundsNEMerc = MercatorCoordinate.fromLngLat(maxBounds.getNorthEast())
const mercatorWidth = maxBoundsNEMerc.x - maxBoundsSWMerc.x
const mercatorHeight = Math.abs(maxBoundsNEMerc.y - maxBoundsSWMerc.y)

const aspectRatio = mercatorWidth / mercatorHeight
const MINIMAP_WIDTH_PX = 192 // w-48 = 12rem
const MINIMAP_HEIGHT_PX = MINIMAP_WIDTH_PX / aspectRatio
const RECTANGLE_MIN_PX = 4 // threshold below which rectangle switches to point

function Minimap() {
  const { map, bounds: mapBounds } = useMap()
  const { canZoomIn, canZoomOut } = useZoomConstraints()
  const containerRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<MapRef>(null)
  // MapContext only emits on `moveend`; subscribe to `move` locally so the
  // viewport rectangle tracks smoothly during pans and zooms.
  const [liveBounds, setLiveBounds] = useState<LngLatBounds | null>(mapBounds)
  const bounds = liveBounds ?? mapBounds

  useEffect(() => {
    if (!map) return

    const handleMove = () => setLiveBounds(map.getBounds())
    map.on('move', handleMove)

    return () => {
      map.off('move', handleMove)
    }
  }, [map])

  const handleMapLoad = () => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return

    minimap.fitBounds(MAP_CONFIG.MAX_BOUNDS, {
      animate: false,
      padding: -1,
    })
  }

  const handleDrag = (event: DragEvent) => {
    if (!map) return
    const lngLat = minimapRef.current?.getMap()?.unproject([event.x, event.y])
    if (!lngLat) return
    map.stop().setCenter([lngLat.lng, lngLat.lat])
  }

  const handleDragStart = (event: DragEvent) => {
    if (!map) return
    const lngLat = minimapRef.current?.getMap()?.unproject([event.x, event.y])
    if (!lngLat) return
    map.stop().easeTo({ center: [lngLat.lng, lngLat.lat] })
  }

  const handleZoom = (delta: number) => {
    if (!map) return

    map.setZoom(map.getZoom() + delta * 0.05)
  }

  useDrag(
    containerRef,
    {
      onStart: handleDragStart,
      onDrag: handleDrag,
    },
    { threshold: 5 }
  )

  useWheel(
    containerRef,
    { onWheel: handleZoom },
    { canScrollUp: canZoomIn, canScrollDown: canZoomOut }
  )

  // Derive GeoJSON data and visibility from bounds
  let rectangleData: GeoJSON.Feature<GeoJSON.Polygon> | null = null
  let pointData: GeoJSON.Feature<GeoJSON.Point> | null = null
  let showAsRect = true

  if (bounds) {
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const center = bounds.getCenter()

    rectangleData = {
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
    }

    pointData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [center.lng, center.lat],
      },
    }

    // Compute viewport pixel size on minimap using Mercator projection
    const swMerc = MercatorCoordinate.fromLngLat(sw)
    const neMerc = MercatorCoordinate.fromLngLat(ne)
    const widthPx = ((neMerc.x - swMerc.x) / mercatorWidth) * MINIMAP_WIDTH_PX
    const heightPx = (Math.abs(neMerc.y - swMerc.y) / mercatorHeight) * MINIMAP_HEIGHT_PX
    showAsRect = Math.min(widthPx, heightPx) >= RECTANGLE_MIN_PX
  }

  return (
    <div
      ref={containerRef}
      className="bg-background w-48 cursor-grab overflow-hidden rounded-md border active:cursor-grabbing"
      style={{ aspectRatio, touchAction: 'none' }}
    >
      <ReactMapGL
        ref={minimapRef}
        mapStyle={minimap as unknown as StyleSpecification}
        interactive={false}
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        {rectangleData && (
          <Source id="viewport-bounds" type="geojson" data={rectangleData}>
            <Layer
              id="viewport-fill"
              type="fill"
              paint={{ 'fill-color': 'rgba(255, 255, 255, 0.1)' }}
              layout={{ visibility: showAsRect ? 'visible' : 'none' }}
            />

            <Layer
              id="viewport-outline"
              type="line"
              paint={{ 'line-color': 'rgba(255, 255, 255, 0.25)', 'line-width': 1 }}
              layout={{ visibility: showAsRect ? 'visible' : 'none' }}
            />
          </Source>
        )}

        {pointData && (
          <Source id="viewport-point" type="geojson" data={pointData}>
            <Layer
              id="viewport-point"
              type="circle"
              paint={{ 'circle-color': 'rgba(255, 255, 255, 0.35)', 'circle-radius': 3 }}
              layout={{ visibility: showAsRect ? 'none' : 'visible' }}
            />
          </Source>
        )}
      </ReactMapGL>
    </div>
  )
}

export { Minimap }
