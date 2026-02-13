import { LngLatBounds, MercatorCoordinate } from 'maplibre-gl'
import { useRef, useState } from 'react'
import { Layer, Map, type MapRef, Source, type StyleSpecification } from 'react-map-gl/maplibre'

import minimap from '@/assets/map-styles/minimap.json'
import { MAP_CONFIG } from '@/config/map'
import { type DragEvent, useDrag } from '@/hooks/useDrag'
import { useWheel } from '@/hooks/useWheel'

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

interface MinimapProps {
  viewportBounds: LngLatBounds | null
  canZoomIn: boolean
  canZoomOut: boolean
  onClick: (lng: number, lat: number) => void
  onDrag: (lng: number, lat: number) => void
  onZoom: (zoomDelta: number) => void
}

function Minimap({ viewportBounds, canZoomIn, canZoomOut, onClick, onDrag, onZoom }: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)

  const handleMapLoad = () => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return

    minimap.fitBounds(MAP_CONFIG.MAX_BOUNDS, {
      animate: false,
      padding: -1,
    })

    setMapReady(true)
  }

  const handleDragStart = (event: DragEvent) => {
    const lngLat = minimapRef.current?.getMap()?.unproject([event.x, event.y])
    if (!lngLat) return

    onClick(lngLat.lng, lngLat.lat)
  }

  const handleDrag = (event: DragEvent) => {
    const lngLat = minimapRef.current?.getMap()?.unproject([event.x, event.y])
    if (!lngLat) return

    onDrag(lngLat.lng, lngLat.lat)
  }

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

  useWheel(
    containerRef,
    { onWheel: onZoom },
    {
      canScrollUp: canZoomIn,
      canScrollDown: canZoomOut,
    }
  )

  // Derive GeoJSON data and visibility from bounds
  let rectangleData: GeoJSON.Feature<GeoJSON.Polygon> | null = null
  let pointData: GeoJSON.Feature<GeoJSON.Point> | null = null
  let showAsRect = true

  if (viewportBounds) {
    const sw = viewportBounds.getSouthWest()
    const ne = viewportBounds.getNorthEast()
    const center = viewportBounds.getCenter()

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
      <Map
        ref={minimapRef}
        mapStyle={minimap as unknown as StyleSpecification}
        interactive={false}
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        {mapReady && (
          <>
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
          </>
        )}
      </Map>
    </div>
  )
}

export default Minimap
