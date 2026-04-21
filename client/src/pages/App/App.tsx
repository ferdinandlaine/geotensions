import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { FiltersProvider } from '@/contexts/FiltersContext'
import { MapProvider } from '@/contexts/MapContext'
import { EventsLayer } from '@/features/Events'
import { Map, MapControls, Minimap } from '@/features/Map'
import { TimeBrush } from '@/features/TimeBrush'
import { useHasFinePointer } from '@/hooks/useHasFinePointer'
import { useIsMobile } from '@/hooks/useIsMobile'

import { AppSidebar } from './AppSidebar'

function App() {
  const isMobile = useIsMobile()
  const hasFinePointer = useHasFinePointer()

  return (
    <SidebarProvider>
      <FiltersProvider>
        <AppSidebar variant="floating" className="pr-0" />
        <SidebarTrigger className="z-10 m-4" />

        <MapProvider>
          <main className="fixed inset-0">
            <Map>
              <EventsLayer />
            </Map>
          </main>

          <div className="fixed inset-x-8 bottom-8">
            <TimeBrush className="mx-auto max-w-4xl" />
          </div>

          <div className="fixed top-4 right-4 flex gap-2">
            {hasFinePointer && <MapControls />}
            {!isMobile && <Minimap />}
          </div>
        </MapProvider>
      </FiltersProvider>
    </SidebarProvider>
  )
}

export { App }
