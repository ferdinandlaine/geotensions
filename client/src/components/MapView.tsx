import { useRef, useState, useCallback, useMemo } from 'react'
import { Map, type LngLatBounds, type MapRef, type StyleSpecification } from 'react-map-gl/maplibre'
import darkMatter from '@/assets/map-styles/dark-matter.json'
import useEvents from '@/hooks/useEvents'
import type { EventsQuery } from '@/types/event'
import { MapControls } from './MapControls'
import { Minimap } from './Minimap'

const INITIAL_ZOOM = 4
const MAX_ZOOM = 16
const MIN_ZOOM = 2

function MapView() {
  const mapRef = useRef<MapRef>(null)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

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
  }, [])

  const handleMinimapNavigate = useCallback((lng: number, lat: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.flyTo({
      center: [lng, lat],
    })
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

  return (
    <>
      <Map
        ref={mapRef}
        mapStyle={darkMatter as unknown as StyleSpecification}
        initialViewState={{
          longitude: 2.35,
          latitude: 48.85,
          zoom: INITIAL_ZOOM,
        }}
        maxZoom={MAX_ZOOM}
        minZoom={MIN_ZOOM}
        dragRotate={false}
        attributionControl={false}
        onLoad={updateBbox}
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
          </pre>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <MapControls mapRef={mapRef} currentZoom={zoom} maxZoom={MAX_ZOOM} minZoom={MIN_ZOOM} />
      </div>

      <div className="absolute bottom-4 left-4">
        <Minimap viewportBounds={bounds} onNavigate={handleMinimapNavigate} />
      </div>
    </>
  )
}

export default MapView
