import type { DateRange as RDPDateRange } from 'react-day-picker'

export type DateRange = {
  from: Date
  to: Date
}

export interface EventFilters {
  dateRange: DateRange
  types: string[]
}

export function isValidDateRange(value: RDPDateRange | undefined): value is DateRange {
  return value?.from !== undefined && value?.to !== undefined
}
