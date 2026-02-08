import { useMemo, useState } from 'react'
import type { LngLatBounds } from 'react-map-gl/maplibre'

import DevBox from '@/components/DevBox'
import { MapView } from '@/features/Map'
import { useEvents } from '@/hooks/useEvents'
import type { BBox, EventsQuery } from '@/types/event'

function App() {
  const initialRange = {
    from: new Date('2024-01-26'),
    to: new Date('2024-01-27'),
  }

  const [dateFrom] = useState(initialRange.from)
  const [dateTo] = useState(initialRange.to)
  const [bounds, setBounds] = useState<LngLatBounds | null>(null)

  const query = useMemo<EventsQuery | undefined>(() => {
    if (!bounds) return

    // Normalize LngLatBounds to plain tuple for stable query key
    // Round to 2 decimals (~1km precision) to avoid cache misses from tiny movements
    const bbox: BBox = [
      Math.round(bounds.getWest() * 100) / 100,
      Math.round(bounds.getSouth() * 100) / 100,
      Math.round(bounds.getEast() * 100) / 100,
      Math.round(bounds.getNorth() * 100) / 100,
    ]

    return {
      bbox,
      filter: {
        dateFrom,
        dateTo,
        types: [],
      },
    }
  }, [bounds, dateFrom, dateTo])

  const { data: events } = useEvents(query)

  return (
    <div className="relative h-screen w-full">
      <MapView onBoundsChange={setBounds}>
        {/* TODO: Add EventsLayer */}
        {/* <EventsLayer events={events} /> */}
      </MapView>

      {import.meta.env.DEV && (
        <div className="absolute top-4 left-4 z-50">
          <DevBox>
            Date range: {dateFrom.toLocaleDateString('fr-FR')} →{' '}
            {dateTo.toLocaleDateString('fr-FR')}
            <br />
            Event count: {events?.features.length ?? 0}
            <br />
            Is truncated: {String(events?.is_truncated ?? false)}
            <br />
            Total events: {events?.total_count ?? 0}
          </DevBox>
        </div>
      )}
    </div>
  )
}

export default App
