import { IconMinus, IconPlus } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useMap } from '@/contexts/MapContext'

import { useZoomConstraints } from './useZoomConstraints'

function MapControls() {
  const { map } = useMap()
  const { canZoomIn, canZoomOut } = useZoomConstraints()

  const zoomIn = () => map?.zoomIn()
  const zoomOut = () => map?.zoomOut()

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

export { MapControls }
