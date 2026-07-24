/* eslint-disable react-refresh/only-export-components */
import { LngLatBounds, Map as MapLibreMap } from 'maplibre-gl'
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
  isSettled: boolean
  registerMap: (map: MapLibreMap) => void
}

const MOVE_THROTTLE_MS = 150
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
  const [isSettled, setIsSettled] = useState<boolean>(false)

  const registerMap = useCallback((m: MapLibreMap) => setMap(m), [])

  useEffect(() => {
    if (!map) return

    const sync = (settled: boolean) => {
      setBounds(map.getBounds())
      setZoom(map.getZoom())
      setIsSettled(settled)
    }

    const onLoad = () => sync(true)

    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const onMove = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        sync(false)
      }, MOVE_THROTTLE_MS)
    }
    const onMoveEnd = () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer)
        throttleTimer = null
      }
      sync(true)
    }

    map.once('load', onLoad)
    map.on('move', onMove)
    map.on('moveend', onMoveEnd)

    return () => {
      map.off('load', onLoad)
      map.off('move', onMove)
      map.off('moveend', onMoveEnd)
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [map])

  return (
    <MapContext.Provider value={{ map, bounds, zoom, isSettled, registerMap }}>
      {children}
    </MapContext.Provider>
  )
}

export { MapProvider, useMap }
