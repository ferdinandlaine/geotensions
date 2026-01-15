import { useRef, useState, useCallback, useMemo } from 'react'
import { Map, type LngLatBounds, type MapRef, type StyleSpecification } from 'react-map-gl/maplibre'
import darkMatter from '@/assets/map-styles/dark-matter.json'
import useEvents from '@/hooks/useEvents'
import type { EventsQuery } from '@/types/event'
import { MapControls } from './MapControls'
import { Minimap } from './Minimap'
import { MAP_CONFIG } from '@/config/map'
import { isAtMaxBoundsLimit } from '@/utils/geo'

function MapView() {
  const mapRef = useRef<MapRef>(null)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [zoom, setZoom] = useState(MAP_CONFIG.INITIAL_ZOOM)

  /* Filters */
  const [dateFrom, setDateFrom] = useState(new Date('2024-01-26'))
  const [dateTo, setDateTo] = useState(new Date('2024-01-27'))
  const [types, setTypes] = useState<string[]>([])

  const updateBbox = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    setBounds(map.getBounds())
  }, [])

  const updateZoom = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    setZoom(map.getZoom())
    setBounds(map.getBounds())
  }, [])

  const handleMinimapNavigate = useCallback((lng: number, lat: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    // Stop any ongoing animation to prevent race conditions
    map.stop().easeTo({ center: [lng, lat] })
  }, [])

  const handleMinimapDrag = useCallback((lng: number, lat: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.jumpTo({ center: [lng, lat] })
  }, [])

  const query = useMemo<EventsQuery | undefined>(() => {
    if (!bounds) return

    return {
      bbox: bounds,
      filter: {
        dateFrom,
        dateTo,
        types,
      },
    }
  }, [bounds, dateFrom, dateTo, types])

  const { data: events, isLoading, isPending, error } = useEvents(query)

  // Calculate if zoom controls should be enabled
  const atMaxBoundsLimit = isAtMaxBoundsLimit(bounds, MAP_CONFIG.MAX_BOUNDS)
  const canZoomIn = zoom < MAP_CONFIG.MAX_ZOOM
  const canZoomOut = zoom > MAP_CONFIG.MIN_ZOOM && !atMaxBoundsLimit

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
        onLoad={updateBbox}
        onMove={updateBbox}
        onMoveEnd={updateBbox}
        onZoom={updateZoom}
      />

      <div className="absolute top-4 left-4">
        {events && (
          <pre className="card bg-neutral-900 px-2 py-1 text-xs text-neutral-100">
            Event count: {events.features.length}
            <br />
            Is truncated: {`${events.is_truncated}`}
            <br />
            Total events: {events.total_count}
            <br />
            Zoom: {zoom.toFixed(2)}
            <br />
            Bounds: {bounds ? 'loaded' : 'null'}
            <br />
            atMaxBoundsLimit: {String(atMaxBoundsLimit)}
            <br />
            canZoomOut: {String(canZoomOut)}
            <br />
            canZoomIn: {String(canZoomIn)}
          </pre>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <MapControls mapRef={mapRef} canZoomIn={canZoomIn} canZoomOut={canZoomOut} />
      </div>

      <div className="absolute bottom-4 left-4">
        <Minimap
          viewportBounds={bounds}
          onNavigate={handleMinimapNavigate}
          onDrag={handleMinimapDrag}
        />
      </div>
    </>
  )
}

export default MapView
