import { renderHook } from '@testing-library/react'
import { addDays, subDays } from 'date-fns'
import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TIME_CONFIG } from '@/config/time'
import type { DateRange } from '@/types/filter'

import { useKeyboardControls } from './useKeyboardControls'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG

function makeEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: 'ArrowRight',
    altKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent
}

function setup(value: DateRange) {
  const onChange = vi.fn()
  const containerRef = { current: null }
  const zoomRef = { current: null }

  const { result } = renderHook(() =>
    useKeyboardControls({
      value,
      onChange,
      containerRef,
      zoomRef,
      containerWidth: 1000,
    })
  )

  return { handler: result.current, onChange }
}

describe('useKeyboardControls moves selection', () => {
  const from = new Date(2022, 5, 10)
  const to = new Date(2022, 5, 20)

  it('ArrowRight moves selection forward by 1 day', () => {
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowRight' }))

    expect(onChange).toHaveBeenCalledWith({
      from: addDays(from, 1),
      to: addDays(to, 1),
    })
  })

  it('ArrowLeft moves selection backward by 1 day', () => {
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowLeft' }))

    expect(onChange).toHaveBeenCalledWith({
      from: subDays(from, 1),
      to: subDays(to, 1),
    })
  })

  it('Shift+ArrowRight jumps by full span', () => {
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowRight', shiftKey: true }))

    // span is 10 days, so step = 11
    expect(onChange).toHaveBeenCalledWith({
      from: addDays(from, 11),
      to: addDays(to, 11),
    })
  })

  it('clamps to COVERAGE_START_DATE when moving left past start', () => {
    const nearStart = {
      from: COVERAGE_START_DATE,
      to: addDays(COVERAGE_START_DATE, 5),
    }
    const { handler, onChange } = setup(nearStart)
    handler(makeEvent({ key: 'ArrowLeft' }))

    const result = onChange.mock.calls[0][0]
    expect(result.from.getTime()).toBeGreaterThanOrEqual(COVERAGE_START_DATE.getTime())
  })

  it('clamps to COVERAGE_END_DATE when moving right past end', () => {
    const nearEnd = {
      from: subDays(COVERAGE_END_DATE, 5),
      to: COVERAGE_END_DATE,
    }
    const { handler, onChange } = setup(nearEnd)
    handler(makeEvent({ key: 'ArrowRight' }))

    const result = onChange.mock.calls[0][0]
    expect(result.to.getTime()).toBeLessThanOrEqual(COVERAGE_END_DATE.getTime())
  })
})

describe('useKeyboardControls resizes selection', () => {
  const from = new Date(2022, 5, 10)
  const to = new Date(2022, 5, 20)

  it('ArrowUp grows selection by 1 day', () => {
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowUp' }))

    expect(onChange).toHaveBeenCalledWith({
      from,
      to: addDays(to, 1),
    })
  })

  it('ArrowDown shrinks selection by 1 day', () => {
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowDown' }))

    expect(onChange).toHaveBeenCalledWith({
      from,
      to: subDays(to, 1),
    })
  })

  it('ArrowDown does not shrink below from date', () => {
    const singleDay = { from, to: from }
    const { handler, onChange } = setup(singleDay)
    handler(makeEvent({ key: 'ArrowDown' }))

    const result = onChange.mock.calls[0][0]
    expect(result.to.getTime()).toBeGreaterThanOrEqual(from.getTime())
  })

  it('Shift+ArrowUp snaps to next week boundary', () => {
    // 11-day span (from June 10 to June 20 inclusive) → snap to 14 days
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowUp', shiftKey: true }))

    const result = onChange.mock.calls[0][0]
    const newSpan = result.to.getTime() - result.from.getTime()
    expect(newSpan / (1000 * 60 * 60 * 24) + 1).toBe(14)
  })

  it('Shift+ArrowDown snaps to previous week boundary', () => {
    // 11-day span → snap down to 7 days
    const { handler, onChange } = setup({ from, to })
    handler(makeEvent({ key: 'ArrowDown', shiftKey: true }))

    const result = onChange.mock.calls[0][0]
    const newSpan = result.to.getTime() - result.from.getTime()
    expect(newSpan / (1000 * 60 * 60 * 24) + 1).toBe(7)
  })
})

describe('useKeyboardControls ignores keys', () => {
  it('does not call onChange for non-arrow keys', () => {
    const { handler, onChange } = setup({
      from: new Date(2022, 5, 10),
      to: new Date(2022, 5, 20),
    })
    handler(makeEvent({ key: 'Enter' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call preventDefault for non-arrow keys', () => {
    const { handler } = setup({
      from: new Date(2022, 5, 10),
      to: new Date(2022, 5, 20),
    })
    const event = makeEvent({ key: 'Tab' })
    handler(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
