import type { ScaleTime } from 'd3-scale'
import { timeDay } from 'd3-time'
import { clamp, max, subDays } from 'date-fns'

import { TIME_CONFIG } from '@/config/time'
import type { DateRange } from '@/types/filter'

const COVERAGE_BOUNDS = { start: TIME_CONFIG.COVERAGE_START_DATE, end: TIME_CONFIG.COVERAGE_END_DATE }

/**
 * Converts pixel positions to normalized date range.
 *
 * @param x0 - Left pixel position
 * @param x1 - Right pixel position
 * @param xScale - D3 time scale for pixel-to-date conversion
 * @returns Normalized date range with from/to on day boundaries
 */
export function normalizeSelection(x0: number, x1: number, xScale: ScaleTime<number, number>): DateRange {
  const fromDate = clamp(xScale.invert(x0), COVERAGE_BOUNDS)
  const toDate = clamp(xScale.invert(x1), COVERAGE_BOUNDS)
  const from = timeDay.round(fromDate)
  // Visual range is [from, to+1), so subtract 1 day before rounding to get inclusive end date
  const toRounded = timeDay.round(subDays(toDate, 1))
  // Ensure to >= from (minimum single-day selection)
  const to = max([toRounded, from])

  return { from, to }
}
