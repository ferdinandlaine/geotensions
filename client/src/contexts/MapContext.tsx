/* eslint-disable react-refresh/only-export-components */
import { LngLatBounds } from 'maplibre-gl'
import {
  createContext,
  type PropsWithChildren,
  type RefObject,
  useContext,
  useRef,
  useState,
} from 'react'
import type { MapRef } from 'react-map-gl/maplibre'

interface MapContextValue {
  mapRef: RefObject<MapRef | null>
  bounds: LngLatBounds | null
  zoom: number | null
  setBounds: (bounds: LngLatBounds) => void
  setZoom: (zoom: number) => void
}

const MapContext = createContext<MapContextValue | null>(null)

function useMap() {
  const context = useContext(MapContext)

  if (!context) {
    throw new Error('useMap must be used within a MapProvider')
  }

  return context
}

function MapProvider({ children }: PropsWithChildren) {
  const mapRef = useRef<MapRef>(null)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [zoom, setZoom] = useState<number | null>(null)

  return (
    <MapContext.Provider value={{ mapRef, bounds, zoom, setBounds, setZoom }}>
      {children}
    </MapContext.Provider>
  )
}

export { MapProvider, useMap }
