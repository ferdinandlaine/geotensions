import { Map, NavigationControl } from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import darkMatter from '@assets/map-styles/dark-matter.json'
// import positron from '@assets/map-styles/positron.json'

function MapView() {
  return (
    <Map
      mapStyle={darkMatter as unknown as StyleSpecification}
      projection="globe"
      initialViewState={{
        longitude: 2.35,
        latitude: 48.85,
        zoom: 5,
      }}
      minZoom={2}
      attributionControl={false}
    >
      <NavigationControl />
    </Map>
  )
}

export default MapView
