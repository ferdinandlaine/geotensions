export type DateRange = {
  from: Date
  to: Date
}

export interface EventFilters {
  dateRange: DateRange
  eventTypes: string[]
}
