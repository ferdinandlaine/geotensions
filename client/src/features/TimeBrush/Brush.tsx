import { brushX, type D3BrushEvent } from 'd3-brush'
import type { ScaleTime } from 'd3-scale'
import { pointer, select } from 'd3-selection'
import { timeDay } from 'd3-time'
import { addDays, clamp } from 'date-fns'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { TIME_CONFIG } from '@/config/time'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types/filter'

import { normalizeSelection } from './normalizeSelection'

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
          const from = clamp(timeDay.round(xScale.invert(cx)), COVERAGE_BOUNDS)

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

  // Update brush position when selection or scale changes
  useLayoutEffect(() => {
    if (!brushGroupRef.current || !brushInstanceRef.current) return

    select(brushGroupRef.current).call(brushInstanceRef.current.move, [
      xScale(selection.from),
      xScale(addDays(selection.to, 1)),
    ])
  }, [selection, xScale])

  const fadeWidth = 12 * HANDLE_WIDTH
  const maskWidth = width + 2 * fadeWidth
  const fadeRatio = fadeWidth / maskWidth

  return (
    <svg
      ref={svgRef}
      width={width}
      height={BRUSH_HEIGHT}
      overflow="visible"
      className={cn('brush focus-within:outline-none', className)}
    >
      <defs>
        <linearGradient id="brush-fade-gradient">
          <stop offset="0%" stopColor="black" />
          <stop offset={`${fadeRatio * 100}%`} stopColor="white" />
          <stop offset={`${(1 - fadeRatio) * 100}%`} stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>

        <mask id="brush-mask">
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

export { Brush }
