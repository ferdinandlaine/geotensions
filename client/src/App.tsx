import { endOfMonth } from 'date-fns'
import { useMemo, useState } from 'react'
import type { LngLatBounds } from 'react-map-gl/maplibre'

import AppSidebar from './components/AppSidebar'
import { SidebarProvider, SidebarSeparator, SidebarTrigger } from './components/ui/sidebar'
import { DateRangeFilter, EventTypeFilter } from './features/Filters'
import { MapView } from './features/Map'
import { useEvents } from './hooks/useEvents'
import type { BBox, EventsQuery } from './types/event'
import { type DateRange, isValidDateRange } from './types/filter'

function App() {
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date('2025-01-01'),
    to: endOfMonth(new Date('2025-01-01')),
  })
  const [eventTypes, setEventTypes] = useState<string[]>([])

  const query = useMemo<EventsQuery | undefined>(() => {
    if (!bounds) return

    return {
      bbox: normalizeBbox(bounds),
      filters: {
        dateRange,
        eventTypes,
      },
    }
  }, [bounds, dateRange, eventTypes])

  const { data: events } = useEvents(query)

  return (
    <>
      <SidebarProvider>
        <AppSidebar variant="floating" className="pr-0">
          <DateRangeFilter
            value={dateRange}
            onChange={(range) => isValidDateRange(range) && setDateRange(range)}
          />
          <SidebarSeparator className="mx-0" />
          <EventTypeFilter value={eventTypes} onChange={setEventTypes} />
        </AppSidebar>

        <SidebarTrigger className="relative top-4 left-4 order-1" />

        <main className="fixed inset-0">
          <MapView onBoundsChange={setBounds}>
            {/* TODO: Add EventsLayer */}
            {/* <EventsLayer events={events} /> */}
          </MapView>

          <div className="absolute bottom-8 left-0 flex w-full justify-center">
            <div className="bg-background/75 pointer-events-auto w-full max-w-2xl rounded-lg border p-4 text-center">
              <pre>TimeBrush placeholder</pre>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </>
  )
}

/**
 * Convert LngLatBounds to BBox tuple and round for stable query key.
 * @param precision Number of decimal places (2 ≈ 1km at equator)
 */
function normalizeBbox(bounds: LngLatBounds, precision = 2): BBox {
  const factor = Math.pow(10, precision)

  return [
    Math.round(bounds.getWest() * factor) / factor,
    Math.round(bounds.getSouth() * factor) / factor,
    Math.round(bounds.getEast() * factor) / factor,
    Math.round(bounds.getNorth() * factor) / factor,
  ]
}

export default App
