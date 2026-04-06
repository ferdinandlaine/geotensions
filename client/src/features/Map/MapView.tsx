import { type StyleSpecification } from 'maplibre-gl'
import { type PropsWithChildren } from 'react'
import { Map, type MapEvent, type ViewStateChangeEvent } from 'react-map-gl/maplibre'

import darkMatter from '@/assets/map-styles/dark-matter.json'
import { MAP_CONFIG } from '@/config/map'
import { useMap } from '@/contexts/MapContext'

function MapView({ children }: PropsWithChildren) {
  const { mapRef, setBounds, setZoom } = useMap()

  const handleViewStateChange = (event: ViewStateChangeEvent | MapEvent) => {
    setBounds(event.target.getBounds())
    setZoom(event.target.getZoom())
  }

  const handleMapLoad = (event: MapEvent) => {
    event.target.keyboard.disableRotation()
    handleViewStateChange(event)
  }

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
        renderWorldCopies={false}
        attributionControl={false}
        onLoad={handleMapLoad}
        onMove={handleViewStateChange}
      >
        {children}
      </Map>
    </>
  )
}

export { MapView }
