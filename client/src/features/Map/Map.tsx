import 'maplibre-gl/dist/maplibre-gl.css'

import type { StyleSpecification } from 'maplibre-gl'
import type { PropsWithChildren } from 'react'
import { Map as ReactMapGL, type MapEvent, type MapRef } from 'react-map-gl/maplibre'

import darkMatter from '@/assets/map-styles/dark-matter.json'
import { MAP_CONFIG } from '@/config/map'
import { useMap } from '@/contexts/MapContext'

import { useZoomBoundaryWheel } from './useZoomBoundaryWheel'

function Map({ children }: PropsWithChildren) {
  const { map, registerMap } = useMap()

  useZoomBoundaryWheel(map)

  const handleRef = (ref: MapRef | null) => {
    if (!ref) return
    registerMap(ref.getMap())
  }

  const handleMapLoad = (event: MapEvent) => {
    event.target.keyboard.disableRotation()
    event.target
      .getContainer()
      .querySelector('.maplibregl-ctrl-attrib-button')
      ?.setAttribute('tabIndex', '-1')
    event.target.touchZoomRotate.disableRotation()
  }

  return (
    <ReactMapGL
      ref={handleRef}
      mapStyle={darkMatter as StyleSpecification}
      initialViewState={{
        longitude: MAP_CONFIG.INITIAL_VIEW_STATE.longitude,
        latitude: MAP_CONFIG.INITIAL_VIEW_STATE.latitude,
        zoom: MAP_CONFIG.INITIAL_ZOOM,
      }}
      minZoom={MAP_CONFIG.MIN_ZOOM}
      maxZoom={MAP_CONFIG.MAX_ZOOM}
      maxBounds={MAP_CONFIG.MAX_BOUNDS}
      dragRotate={false}
      touchPitch={false}
      renderWorldCopies={false}
      attributionControl={{ compact: true }}
      interactiveLayerIds={['events-layer']}
      onLoad={handleMapLoad}
    >
      {children}
    </ReactMapGL>
  )
}

export { Map }
