import { type RefObject } from 'react'
import { createPortal } from 'react-dom'

import { MapControls } from './MapControls'
import { MapView } from './MapView'
import { Minimap } from './Minimap'

interface MapProps {
  controlsPortal: RefObject<HTMLElement | null>
}

function Map({ controlsPortal }: MapProps) {
  return (
    <>
      <MapView />

      {controlsPortal.current &&
        createPortal(
          <>
            <MapControls />
            <Minimap />
          </>,
          controlsPortal.current
        )}
    </>
  )
}

export { Map }
