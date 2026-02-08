import type { DateRange as RDPDateRange } from 'react-day-picker'

export type DateRange = {
  from: Date
  to: Date
}

export function isValidDateRange(range: RDPDateRange | undefined): range is DateRange {
  return range?.from !== undefined && range?.to !== undefined
}

export interface EventFilters {
  dateRange: DateRange
  eventTypes: string[]
}
