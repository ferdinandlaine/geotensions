import type { MapRef } from 'react-map-gl/maplibre'
import { IconMinus, IconPlus } from '@tabler/icons-react'

interface MapControlsProps {
  mapRef: React.RefObject<MapRef | null>
  canZoomIn: boolean
  canZoomOut: boolean
}

export function MapControls({ mapRef, canZoomIn, canZoomOut }: MapControlsProps) {
  const zoomIn = () => {
    mapRef.current?.getMap()?.zoomIn()
  }

  const zoomOut = () => {
    mapRef.current?.getMap()?.zoomOut()
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className="cursor-pointer p-1 text-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500"
        aria-label="Zoom in"
        disabled={!canZoomIn}
        onClick={zoomIn}
      >
        <IconPlus />
      </button>

      <button
        className="cursor-pointer p-1 text-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500"
        aria-label="Zoom out"
        disabled={!canZoomOut}
        onClick={zoomOut}
      >
        <IconMinus />
      </button>
    </div>
  )
}
