import { scaleTime } from 'd3-scale'
import { describe, expect, it } from 'vitest'

import { TIME_CONFIG } from '@/config/time'

import { normalizeSelection } from './normalizeSelection'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG

/** Builds a scale identical to what TimeBrush passes to Brush */
function makeScale(width = 1000) {
  return scaleTime().domain([COVERAGE_START_DATE, COVERAGE_END_DATE]).range([0, width])
}

describe('normalizeSelection', () => {
  it('returns dates snapped to day boundaries', () => {
    const scale = makeScale()
    const from = new Date(2022, 5, 10) // June 10
    const to = new Date(2022, 5, 20) // June 20
    // Offset x positions slightly from exact midnight to simulate imprecise drag
    const x0 = scale(from) + 0.3
    const x1 = scale(to) + 0.3

    const result = normalizeSelection(x0, x1, scale)

    // from should snap to midnight
    expect(result.from.getHours()).toBe(0)
    expect(result.from.getMinutes()).toBe(0)
    // to should be a whole day boundary
    expect(result.to.getHours()).toBe(0)
    expect(result.to.getMinutes()).toBe(0)
    // to must be >= from
    expect(result.to >= result.from).toBe(true)
  })

  it('visual range is [from, to+1): x1 at midnight of day D gives to = D-1', () => {
    const scale = makeScale()
    const from = new Date(2022, 5, 10) // June 10 00:00
    const x1Target = new Date(2022, 5, 21) // June 21 00:00 (exclusive end)
    const x0 = scale(from)
    const x1 = scale(x1Target)

    const result = normalizeSelection(x0, x1, scale)

    expect(result.from).toEqual(new Date(2022, 5, 10))
    expect(result.to).toEqual(new Date(2022, 5, 20)) // inclusive end = 21 - 1
  })

  it('enforces a minimum single-day selection when x0 === x1', () => {
    const scale = makeScale()
    const day = new Date(2022, 5, 15)
    const x = scale(day)

    const result = normalizeSelection(x, x, scale)

    expect(result.to).toEqual(result.from)
  })

  it('clamps to COVERAGE_START_DATE when x0 is before the timeline', () => {
    const scale = makeScale()
    const result = normalizeSelection(-100, scale(new Date(2022, 0, 10)), scale)

    expect(result.from.getTime()).toBeGreaterThanOrEqual(COVERAGE_START_DATE.getTime())
  })

  it('clamps to COVERAGE_END_DATE when x1 is beyond the timeline', () => {
    const scale = makeScale()
    const result = normalizeSelection(scale(new Date(2022, 0, 1)), 9999, scale)

    expect(result.to.getTime()).toBeLessThanOrEqual(COVERAGE_END_DATE.getTime())
  })
})
