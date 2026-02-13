import { IconAlertCircle } from '@tabler/icons-react'
import { startOfDay, subYears } from 'date-fns'
import { useMemo, useState } from 'react'
import type { LngLatBounds } from 'react-map-gl/maplibre'

import AppSidebar from './components/AppSidebar'
import { Alert, AlertDescription } from './components/ui/alert'
import { SidebarProvider, SidebarSeparator, SidebarTrigger } from './components/ui/sidebar'
import { Spinner } from './components/ui/spinner'
import { DateRangeFilter, EventTypeFilter } from './features/Filters'
import { MapView } from './features/Map'
import { TimeBrush } from './features/TimeBrush'
import { useDebounced } from './hooks/useDebounced'
import { useEvents } from './hooks/useEvents'
import type { BBox, EventsQuery } from './types/event'
import { type DateRange, isValidDateRange } from './types/filter'

function App() {
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subYears(new Date(), 2)),
    to: startOfDay(subYears(new Date(), 1)),
  })
  const [eventTypes, setEventTypes] = useState<string[]>([])

  const debouncedBounds = useDebounced(bounds, 300)
  const query = useMemo<EventsQuery | undefined>(() => {
    if (!debouncedBounds) return

    return {
      bbox: normalizeBbox(debouncedBounds),
      filters: {
        dateRange,
        eventTypes,
      },
    }
  }, [debouncedBounds, dateRange, eventTypes])

  const { data: events, isFetching, isError } = useEvents(query)

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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-8 *:pointer-events-auto">
            {isFetching && (
              <div className="bg-background/75 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm backdrop-blur-xs">
                <Spinner />
                <span>Loading events…</span>
              </div>
            )}

            {isError && (
              <Alert variant="destructive" className="w-fit">
                <IconAlertCircle />
                <AlertDescription>Failed to load events</AlertDescription>
              </Alert>
            )}

            <TimeBrush className="max-w-4xl pb-8" value={dateRange} onChange={setDateRange} />
          </div>

          <div className="absolute top-4 right-4 flex gap-2" />
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
