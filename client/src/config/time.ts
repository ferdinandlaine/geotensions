import { subYears } from 'date-fns'

export const TIME_CONFIG = {
  COVERAGE_START_DATE: new Date(2020, 0, 1),
  COVERAGE_END_DATE: subYears(new Date(), 1),
} as const
