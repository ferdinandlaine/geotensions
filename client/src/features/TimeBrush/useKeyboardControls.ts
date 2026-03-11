import { select } from 'd3-selection'
import type { ZoomBehavior } from 'd3-zoom'
import { zoomIdentity, zoomTransform } from 'd3-zoom'
import { addDays, clamp, differenceInDays, subDays } from 'date-fns'
import { type RefObject, useCallback } from 'react'

import { TIME_CONFIG } from '@/config/time'
import type { DateRange } from '@/types/filter'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG
const TOTAL_DAYS = differenceInDays(COVERAGE_END_DATE, COVERAGE_START_DATE)

interface UseKeyboardControlsParams {
  value: DateRange | null
  onChange: (range: DateRange) => void
  containerRef: RefObject<HTMLDivElement | null>
  zoomRef: RefObject<ZoomBehavior<HTMLDivElement, unknown> | null>
  containerWidth: number | null
}

export function useKeyboardControls({
  value,
  onChange,
  containerRef,
  zoomRef,
  containerWidth,
}: UseKeyboardControlsParams): React.KeyboardEventHandler {
  return useCallback(
    (event: React.KeyboardEvent) => {
      const { key, altKey, shiftKey } = event
      const isHorizontal = key === 'ArrowLeft' || key === 'ArrowRight'
      const isVertical = key === 'ArrowUp' || key === 'ArrowDown'

      if (!isHorizontal && !isVertical) return
      if (!containerWidth || !value) return

      event.preventDefault()

      // Viewport controls (Alt + arrows)
      if (altKey) {
        if (!containerRef.current || !zoomRef.current) return

        const container = select(containerRef.current)
        const zoomBehavior = zoomRef.current

        if (isHorizontal) {
          const transform = zoomTransform(containerRef.current)
          const direction = key === 'ArrowRight' ? -1 : 1
          const visibleDays = TOTAL_DAYS / transform.k
          const step = shiftKey ? Math.round(visibleDays / 2) : 1

          const translateX = direction * step * (containerWidth / TOTAL_DAYS)
          const newTransform = transform.translate(translateX, 0)

          const k = newTransform.k
          const x = Math.max(-(k - 1) * containerWidth, Math.min(0, newTransform.x))

          container.call(zoomBehavior.transform, zoomIdentity.translate(x, 0).scale(k))
        } else {
          const liveTransform = zoomTransform(containerRef.current)
          const zoomOut = key === 'ArrowDown'

          const zoomFactor = shiftKey ? 2 : 1.5
          const targetScale = zoomOut ? liveTransform.k / zoomFactor : liveTransform.k * zoomFactor

          container.call(zoomBehavior.scaleTo, targetScale)
        }
        return
      }

      // Selection controls (arrows without modifier)
      const { from, to } = value
      const selectionDays = differenceInDays(to, from)

      if (isHorizontal) {
        const direction = key === 'ArrowRight' ? 1 : -1
        const step = shiftKey ? selectionDays + 1 : 1

        const shifted = {
          from: addDays(from, direction * step),
          to: addDays(to, direction * step),
        }

        if (shifted.from < COVERAGE_START_DATE) {
          shifted.from = COVERAGE_START_DATE
          shifted.to = addDays(COVERAGE_START_DATE, selectionDays)
        }
        if (shifted.to > COVERAGE_END_DATE) {
          shifted.to = COVERAGE_END_DATE
          shifted.from = subDays(COVERAGE_END_DATE, selectionDays)
        }

        onChange(shifted)
      } else {
        const expanding = key === 'ArrowUp'

        if (!shiftKey) {
          const newTo = expanding ? addDays(to, 1) : subDays(to, 1)
          const clamped = clamp(newTo, { start: from, end: COVERAGE_END_DATE })

          onChange({ from, to: clamped })
        } else {
          const span = selectionDays + 1
          const step = expanding
            ? Math.ceil(span / 7) * 7 - span || 7
            : span - (Math.floor((span - 1) / 7) * 7 || 1)

          const newTo = expanding ? addDays(to, step) : subDays(to, step)
          const clamped = clamp(newTo, { start: from, end: COVERAGE_END_DATE })

          onChange({ from, to: clamped })
        }
      }
    },
    [containerWidth, value, onChange, containerRef, zoomRef]
  )
}
