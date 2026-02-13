import { brushX, type D3BrushEvent } from 'd3-brush'
import type { ScaleTime } from 'd3-scale'
import { pointer, select } from 'd3-selection'
import { timeDay } from 'd3-time'
import { addDays, clamp, differenceInDays, max, subDays } from 'date-fns'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { TIME_CONFIG } from '@/config/time'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types/filter'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG
const COVERAGE_BOUNDS = { start: COVERAGE_START_DATE, end: COVERAGE_END_DATE }
const BRUSH_HEIGHT = 66
const HANDLE_WIDTH = 8

interface MainBrushProps {
  xScale: ScaleTime<number, number>
  selection: DateRange
  className?: string
  onSelectionChange: (selection: DateRange) => void
}

/**
 * Time brush component with D3 brushX for temporal selection.
 *
 * Features:
 * - Drag handles to adjust selection range
 * - Click outside brush to create single-day selection at click position
 * - Automatic snapping to day boundaries
 * - Visual range displays [from, to+1) for inclusive end date
 *
 * @param xScale - D3 time scale mapping dates to pixel positions
 * @param selection - Current date range selection
 * @param onSelectionChange - Callback fired when selection changes
 */
function Brush({ xScale, selection, className, onSelectionChange }: MainBrushProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const brushGroupRef = useRef<SVGGElement>(null)
  const brushInstanceRef = useRef<ReturnType<typeof brushX> | null>(null)
  const selectionRef = useRef(selection)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const width = xScale.range()[1]

  useEffect(() => {
    selectionRef.current = selection
    onSelectionChangeRef.current = onSelectionChange
  }, [selection, onSelectionChange])

  // Native listener to prevent d3-zoom pan from activating during brush drag
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const stop = (e: MouseEvent) => e.stopPropagation()
    svg.addEventListener('mousedown', stop)

    return () => svg.removeEventListener('mousedown', stop)
  }, [])

  useLayoutEffect(() => {
    if (!brushGroupRef.current) return

    const brushGroup = select(brushGroupRef.current)
    const brush = brushX()
      .extent([
        [xScale(COVERAGE_START_DATE), 0],
        [xScale(COVERAGE_END_DATE), BRUSH_HEIGHT],
      ])
      .on('brush', (event: D3BrushEvent<unknown>) => {
        if (!event.selection) return

        const [x0, x1] = event.selection as [number, number]
        brushGroup.select('.handle-line--w').attr('x1', x0).attr('x2', x0)
        brushGroup.select('.handle-line--e').attr('x1', x1).attr('x2', x1)
      })
      .on('end', (event: D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return

        // Click outside brush → new single-day selection
        if (!event.selection) {
          const [cx] = pointer(event.sourceEvent, brushGroup.node())
          const from = timeDay.round(xScale.invert(cx))

          brushGroup.call(brush.move, [xScale(from), xScale(addDays(from, 1))])
          onSelectionChangeRef.current({ from, to: from })

          return
        }

        const [x0, x1] = event.selection as [number, number]
        const { from, to } = normalizeSelection(x0, x1, xScale)

        brushGroup.call(brush.move, [xScale(from), xScale(addDays(to, 1))])
        onSelectionChangeRef.current({ from, to })
      })

    brush.handleSize(HANDLE_WIDTH)
    brushGroup.call(brush)

    // Must be after .call(brush) to render above the brush overlay
    if (brushGroup.selectAll('.handle-line').empty()) {
      brushGroup
        .append('line')
        .attr('class', 'handle-line handle-line--w')
        .attr('y1', BRUSH_HEIGHT * (2 / 5))
        .attr('y2', BRUSH_HEIGHT * (3 / 5))
      brushGroup
        .append('line')
        .attr('class', 'handle-line handle-line--e')
        .attr('y1', BRUSH_HEIGHT * (2 / 5))
        .attr('y2', BRUSH_HEIGHT * (3 / 5))
    }

    brushInstanceRef.current = brush

    return () => {
      brushGroup.on('.brush', null)
    }
  }, [width, xScale])

  // Sync brush position with selection
  useLayoutEffect(() => {
    if (!brushGroupRef.current || !brushInstanceRef.current) return

    select(brushGroupRef.current).call(brushInstanceRef.current.move, [
      xScale(selection.from),
      xScale(addDays(selection.to, 1)),
    ])
  }, [selection, xScale])

  function handleKeyDown(event: React.KeyboardEvent) {
    const { from, to } = selectionRef.current
    const selectionDays = differenceInDays(to, from)

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      const step = event.shiftKey ? selectionDays : 1
      shiftSelection(direction * step)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? 1 : -1
      const step = event.shiftKey ? 7 : 1
      resizeSelection(direction * step)
    }
  }

  function shiftSelection(days: number) {
    const { from, to } = selectionRef.current
    const shifted = {
      from: addDays(from, days),
      to: addDays(to, days),
    }

    // Clamp to coverage bounds, preserving selection width
    if (shifted.from < COVERAGE_START_DATE) {
      const diff = to.getTime() - from.getTime()
      shifted.from = COVERAGE_START_DATE
      shifted.to = new Date(COVERAGE_START_DATE.getTime() + diff)
    }

    if (shifted.to > COVERAGE_END_DATE) {
      const diff = to.getTime() - from.getTime()
      shifted.to = COVERAGE_END_DATE
      shifted.from = new Date(COVERAGE_END_DATE.getTime() - diff)
    }

    onSelectionChangeRef.current(shifted)
  }

  function resizeSelection(days: number) {
    const { from, to } = selectionRef.current
    const newTo = clamp(addDays(to, days), COVERAGE_BOUNDS)

    if (from > newTo) return
    onSelectionChange({ from, to: newTo })
  }

  const fadeWidth = 12 * HANDLE_WIDTH
  const maskWidth = width + 2 * fadeWidth
  const fadeRatio = fadeWidth / maskWidth

  return (
    <svg
      ref={svgRef}
      width={width}
      height={BRUSH_HEIGHT}
      overflow="visible"
      tabIndex={0}
      className={cn('brush focus-within:outline-none', className)}
      onKeyDown={handleKeyDown}
    >
      <defs>
        <linearGradient id="brush-fade-gradient">
          <stop offset="0%" stopColor="black" />
          <stop offset={`${fadeRatio * 100}%`} stopColor="white" />
          <stop offset={`${(1 - fadeRatio) * 100}%`} stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>

        <mask id="brush-mask">
          {/* Extra height for stroke */}
          <rect
            x={-fadeWidth}
            y={-1}
            width={maskWidth}
            height={BRUSH_HEIGHT + 2}
            fill="url(#brush-fade-gradient)"
          />
        </mask>
      </defs>

      <g ref={brushGroupRef} mask="url(#brush-mask)" />
    </svg>
  )
}

/**
 * Converts pixel positions to normalized date range.
 *
 * @param x0 - Left pixel position
 * @param x1 - Right pixel position
 * @param xScale - D3 time scale for pixel-to-date conversion
 * @returns Normalized date range with from/to on day boundaries
 */
function normalizeSelection(x0: number, x1: number, xScale: ScaleTime<number, number>): DateRange {
  const fromDate = clamp(xScale.invert(x0), COVERAGE_BOUNDS)
  const toDate = clamp(xScale.invert(x1), COVERAGE_BOUNDS)
  const from = timeDay.round(fromDate)
  // Visual range is [from, to+1), so subtract 1 day before rounding to get inclusive end date
  const toRounded = timeDay.round(subDays(toDate, 1))
  // Ensure to >= from (minimum single-day selection)
  const to = max([toRounded, from])

  return { from, to }
}

export default Brush
