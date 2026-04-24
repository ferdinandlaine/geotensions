/* eslint-disable react-refresh/only-export-components */
import type { LngLatBounds, Map as MapLibreMap } from 'maplibre-gl'
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface MapContextValue {
  map: MapLibreMap | null
  bounds: LngLatBounds | null
  zoom: number | null
  registerMap: (map: MapLibreMap) => void
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
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [zoom, setZoom] = useState<number | null>(null)

  const registerMap = useCallback((m: MapLibreMap) => setMap(m), [])

  useEffect(() => {
    if (!map) return

    const sync = () => {
      setBounds(map.getBounds())
      setZoom(map.getZoom())
    }

    map.once('load', sync)
    map.on('moveend', sync)

    return () => {
      map.off('load', sync)
      map.off('moveend', sync)
    }
  }, [map])

  return (
    <MapContext.Provider value={{ map, bounds, zoom, registerMap }}>{children}</MapContext.Provider>
  )
}

export { MapProvider, useMap }
