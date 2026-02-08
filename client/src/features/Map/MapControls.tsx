import { IconMinus, IconPlus } from '@tabler/icons-react'
import type { RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

interface MapControlsProps {
  mapRef: RefObject<MapRef | null>
  canZoomIn: boolean
  canZoomOut: boolean
}

function MapControls({ mapRef, canZoomIn, canZoomOut }: MapControlsProps) {
  const zoomIn = () => {
    mapRef.current?.getMap()?.zoomIn()
  }

  const zoomOut = () => {
    mapRef.current?.getMap()?.zoomOut()
  }

  return (
    <ButtonGroup orientation="vertical" aria-label="Map controls">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom in"
        disabled={!canZoomIn}
        onClick={zoomIn}
      >
        <IconPlus />
      </Button>

      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom out"
        disabled={!canZoomOut}
        onClick={zoomOut}
      >
        <IconMinus />
      </Button>
    </ButtonGroup>
  )
}

export default MapControls
