import { scaleTime } from 'd3-scale'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TIME_CONFIG } from '@/config/time'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types/filter'

import Brush from './Brush'
import TimeAxis from './TimeAxis'

export interface TimeBrushProps {
  value: DateRange
  className?: string
  onChange: (range: DateRange) => void
}

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG
const MAX_SCALE =
  (COVERAGE_END_DATE.getTime() - COVERAGE_START_DATE.getTime()) / (8 * 24 * 60 * 60 * 1000)

function TimeBrush({ value, className, onChange }: TimeBrushProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ReturnType<typeof zoom<HTMLDivElement, unknown>> | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [currentTransform, setCurrentTransform] = useState(zoomIdentity)

  const xScale = useMemo(
    () =>
      currentTransform.rescaleX(
        scaleTime()
          .domain([COVERAGE_START_DATE, COVERAGE_END_DATE])
          .range([0, containerWidth ?? 0])
      ),
    [currentTransform, containerWidth]
  )

  // Initialize zoom behavior
  useEffect(() => {
    if (!containerRef.current) return

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([1, MAX_SCALE])
      .filter((event) => event.type !== 'dblclick')
      .on('zoom', (event) => {
        setCurrentTransform(event.transform)
      })

    const container = select(containerRef.current)
    container.call(zoomBehavior)
    zoomRef.current = zoomBehavior

    return () => {
      container.on('.zoom', null)
    }
  }, [])

  // Fit pan limits to new width, reset to unzoomed state
  useEffect(() => {
    const container = containerRef.current
    const zoom = zoomRef.current

    if (!container || !containerWidth || !zoom) return

    zoom.translateExtent([
      [0, 0],
      [containerWidth, 0],
    ])

    select(container).call(zoom.transform, zoomIdentity)
  }, [containerWidth])

  useResizeObserver(containerRef, {
    onResize: setContainerWidth,
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'time-brush z-20 flex w-full cursor-grab flex-col overflow-visible select-none active:cursor-grabbing',
        className
      )}
    >
      {containerWidth && (
        <>
          <Brush xScale={xScale} selection={value} onSelectionChange={onChange} className="z-10" />
          <TimeAxis xScale={xScale} />
          {/* <Overview xScale={xScale} /> */}
        </>
      )}
    </div>
  )
}

export { TimeBrush }
