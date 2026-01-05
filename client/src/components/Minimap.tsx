import { useCallback, useEffect, useRef } from 'react'
import {
  Map,
  type LngLatBounds,
  type MapMouseEvent,
  type MapRef,
  type StyleSpecification,
} from 'react-map-gl/maplibre'
import type { GeoJSONSource } from 'maplibre-gl'
import minimap from '@/assets/map-styles/minimap.json'

interface Props {
  viewportBounds: LngLatBounds | null
  onNavigate: (lng: number, lat: number) => void
}

export function Minimap({ viewportBounds, onNavigate }: Props) {
  const minimapRef = useRef<MapRef>(null)

  useEffect(() => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap || !viewportBounds) return

    const viewportBoundsSource = minimap.getSource('viewport-bounds') as GeoJSONSource
    if (!viewportBoundsSource) return

    // Extract bounds coordinates
    const sw = viewportBounds.getSouthWest()
    const ne = viewportBounds.getNorthEast()

    // Create rectangle GeoJSON
    viewportBoundsSource.setData({
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
  }, [viewportBounds])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      onNavigate(e.lngLat.lng, e.lngLat.lat)
    },
    [onNavigate]
  )

  const handleLoad = () => {
    const minimap = minimapRef.current?.getMap()
    if (!minimap) return

    minimap.fitBounds(
      [
        [-180, 60],
        [180, 90],
      ],
      { animate: false }
    )

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
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.2,
      },
    })

    minimap.addLayer({
      id: 'viewport-outline',
      type: 'line',
      source: 'viewport-bounds',
      paint: {
        'line-color': '#ef4444',
        'line-width': 2,
        'line-opacity': 0.8,
      },
    })
  }

  return (
    <div className="card h-40 w-55">
      <Map
        ref={minimapRef}
        mapStyle={minimap as unknown as StyleSpecification}
        interactive={false}
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleLoad}
        onClick={handleClick}
      />
    </div>
  )
}
