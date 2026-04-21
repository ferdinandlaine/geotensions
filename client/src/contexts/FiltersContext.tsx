/* eslint-disable react-refresh/only-export-components */
import { startOfDay, subYears } from 'date-fns'
import { createContext, type PropsWithChildren, useContext, useState } from 'react'

import type { DateRange } from '@/types/filter'

interface FiltersContextValue {
  dateRange: DateRange
  eventTypes: string[]
  setDateRange: (range: DateRange) => void
  setEventTypes: (types: string[]) => void
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

function useFilters() {
  const context = useContext(FiltersContext)

  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider')
  }

  return context
}

function FiltersProvider({ children }: PropsWithChildren) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subYears(new Date(), 2)),
    to: startOfDay(subYears(new Date(), 1)),
  })
  const [eventTypes, setEventTypes] = useState<string[]>([])

  return (
    <FiltersContext.Provider value={{ dateRange, eventTypes, setDateRange, setEventTypes }}>
      {children}
    </FiltersContext.Provider>
  )
}

export { FiltersProvider, useFilters }
