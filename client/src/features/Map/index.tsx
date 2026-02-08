import { LngLatBounds, type LngLatBoundsLike, type StyleSpecification } from 'maplibre-gl'
import { type PropsWithChildren, useCallback, useRef, useState } from 'react'
import { Map, type MapEvent, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre'

import darkMatter from '@/assets/map-styles/dark-matter.json'
import { MAP_CONFIG } from '@/config/map'

import MapControls from './MapControls'
import Minimap from './Minimap'

/** Check if the viewport touches the bounds on both sides of at least one axis. */
function isViewportAtBoundsEdge(
  viewportBounds: LngLatBounds | null,
  maxBounds: LngLatBoundsLike
): boolean {
  if (!viewportBounds) return false

  const bounds = LngLatBounds.convert(maxBounds)
  const tolerance = 0.1

  const touchesWest = viewportBounds.getWest() <= bounds.getWest() + tolerance
  const touchesEast = viewportBounds.getEast() >= bounds.getEast() - tolerance
  const touchesSouth = viewportBounds.getSouth() <= bounds.getSouth() + tolerance
  const touchesNorth = viewportBounds.getNorth() >= bounds.getNorth() - tolerance

  return (touchesWest && touchesEast) || (touchesSouth && touchesNorth)
}

interface MapViewProps {
  onBoundsChange: (bounds: LngLatBounds) => void
}

function MapView({ children, onBoundsChange }: PropsWithChildren<MapViewProps>) {
  const mapRef = useRef<MapRef>(null)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [zoom, setZoom] = useState(MAP_CONFIG.INITIAL_ZOOM)

  const handleViewStateChange = useCallback(
    (e: ViewStateChangeEvent | MapEvent) => {
      const _bounds = e.target.getBounds()
      const _zoom = e.target.getZoom()

      onBoundsChange(_bounds)
      setBounds(_bounds)
      setZoom(_zoom)
    },
    [onBoundsChange]
  )

  const handleMapLoad = useCallback(
    (e: MapEvent) => {
      e.target.keyboard.disableRotation()
      handleViewStateChange(e)
    },
    [handleViewStateChange]
  )

  const handleMinimapClick = useCallback((lng: number, lat: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.stop().easeTo({ center: [lng, lat] })
  }, [])

  const handleMinimapDrag = useCallback((lng: number, lat: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.stop().setCenter([lng, lat])
  }, [])

  const handleMinimapZoom = useCallback((delta: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.setZoom(map.getZoom() + delta * 0.05)
  }, [])

  const canZoomIn = zoom < MAP_CONFIG.MAX_ZOOM
  const canZoomOut =
    zoom > MAP_CONFIG.MIN_ZOOM && !isViewportAtBoundsEdge(bounds, MAP_CONFIG.MAX_BOUNDS)

  return (
    <>
      <Map
        ref={mapRef}
        mapStyle={darkMatter as unknown as StyleSpecification}
        initialViewState={{
          longitude: MAP_CONFIG.INITIAL_VIEW_STATE.longitude,
          latitude: MAP_CONFIG.INITIAL_VIEW_STATE.latitude,
          zoom: MAP_CONFIG.INITIAL_ZOOM,
        }}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        maxBounds={MAP_CONFIG.MAX_BOUNDS}
        dragRotate={false}
        attributionControl={false}
        renderWorldCopies={false}
        onLoad={handleMapLoad}
        onMove={handleViewStateChange}
      >
        {children}
      </Map>

      <div className="absolute top-4 right-4 flex gap-2">
        <MapControls mapRef={mapRef} canZoomIn={canZoomIn} canZoomOut={canZoomOut} />

        <Minimap
          viewportBounds={bounds}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          onClick={handleMinimapClick}
          onDrag={handleMinimapDrag}
          onZoom={handleMinimapZoom}
        />
      </div>
    </>
  )
}

export { MapView }
