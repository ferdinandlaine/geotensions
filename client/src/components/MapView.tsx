import { useRef, useState, useCallback, useMemo } from 'react'
import { Map, NavigationControl } from 'react-map-gl/maplibre'
import useEvents from '@/hooks/useEvents'
import type { MapRef } from 'react-map-gl/maplibre'
import type { EventFilter } from '@/types/event'
import type { BBox } from '@/types/geo'
import type { StyleSpecification } from 'maplibre-gl'
import darkMatter from '@/assets/map-styles/dark-matter.json'
// import positron from '@/assets/map-styles/positron.json'
import 'maplibre-gl/dist/maplibre-gl.css'

function MapView() {
  const mapRef = useRef<MapRef>(null)
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [dateFrom, setDateFrom] = useState<Date>(new Date('2024-01-26'))
  const [dateTo, setDateTo] = useState<Date>(new Date('2024-01-27'))
  const [types, setTypes] = useState<string[]>(['Protests', 'Riots'])

  const updateBbox = useCallback(() => {
    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    const bounds = map.getBounds()

    setBbox({
      minLon: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLon: bounds.getEast(),
      maxLat: bounds.getNorth(),
    })
  }, [])

  const filter = useMemo<EventFilter | undefined>(() => {
    if (!bbox) return

    return {
      bbox,
      dateFrom,
      dateTo,
      types,
    }
  }, [bbox, dateFrom, dateTo, types])

  const { data: events, isLoading, isPending, error } = useEvents(filter)

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapStyle={darkMatter as unknown as StyleSpecification}
        projection="globe"
        initialViewState={{
          longitude: 2.35,
          latitude: 48.85,
          zoom: 5,
        }}
        minZoom={2}
        attributionControl={false}
        onLoad={updateBbox}
        onMoveEnd={updateBbox}
      >
        <NavigationControl position="top-right" />

        {events && (
          <pre className="fixed top-4 left-4 rounded-sm bg-black px-2 py-1.5 text-gray-200 ring-2 ring-white/10">
            Event count: {events.features.length}
            <br />
            Is truncated: {`${events.is_truncated}`}
            <br />
            Total events: {events.total_count}
          </pre>
        )}
      </Map>
    </div>
  )
}

export default MapView
