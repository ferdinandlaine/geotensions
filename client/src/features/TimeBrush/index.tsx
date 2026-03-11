import { scaleTime } from 'd3-scale'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TIME_CONFIG } from '@/config/time'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types/filter'

import Brush from './Brush'
import { KeyboardShortcutsHint } from './KeyboardShortcutsHint'
import Overview from './Overview'
import TimeAxis from './TimeAxis'
import { useKeyboardControls } from './useKeyboardControls'

export interface TimeBrushProps {
  value: DateRange
  className?: string
  onChange: (range: DateRange) => void
}

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG
const isTouchOnly = matchMedia('(pointer: coarse)').matches
const MAX_SCALE =
  (COVERAGE_END_DATE.getTime() - COVERAGE_START_DATE.getTime()) / (8 * 24 * 60 * 60 * 1000)

function TimeBrush({ value, className, onChange }: TimeBrushProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ReturnType<typeof zoom<HTMLDivElement, unknown>> | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [currentTransform, setCurrentTransform] = useState(zoomIdentity)

  const baseScale = useMemo(
    () =>
      scaleTime()
        .domain([COVERAGE_START_DATE, COVERAGE_END_DATE])
        .range([0, containerWidth ?? 0]),
    [containerWidth]
  )

  const xScale = useMemo(
    () => currentTransform.rescaleX(baseScale.copy()),
    [currentTransform, baseScale]
  )

  const visibleDomain = xScale.domain() as [Date, Date]
  const visibleDomainRef = useRef(visibleDomain)

  useEffect(() => {
    visibleDomainRef.current = visibleDomain
  }, [visibleDomain])

  const handleTeleport = useCallback(
    (domain: [Date, Date]) => {
      const container = containerRef.current
      const zoomBehavior = zoomRef.current
      if (!container || !zoomBehavior || !containerWidth) return

      const x0 = baseScale(domain[0])
      const x1 = baseScale(domain[1])
      const k = containerWidth / (x1 - x0)
      const tx = -x0 * k

      select(container).call(zoomBehavior.transform, zoomIdentity.translate(tx, 0).scale(k))
    },
    [baseScale, containerWidth]
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

    zoom
      .extent([
        [0, 0],
        [containerWidth, 1],
      ])
      .translateExtent([
        [0, 0],
        [containerWidth, 1],
      ])

    select(container).call(zoom.transform, zoomIdentity)
  }, [containerWidth])

  useResizeObserver(containerRef, {
    onResize: setContainerWidth,
  })

  const handleKeyDown = useKeyboardControls({
    value,
    onChange,
    containerRef,
    zoomRef,
    containerWidth,
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'time-brush relative flex w-full cursor-grab flex-col outline-none active:cursor-grabbing',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {containerWidth && (
        <>
          <Brush xScale={xScale} selection={value} onSelectionChange={onChange} className="mb-4" />
          <Overview
            xScale={baseScale}
            visibleDomain={visibleDomain}
            selectedRange={value}
            onTeleport={handleTeleport}
          />
          <TimeAxis xScale={xScale} />
        </>
      )}

      {!isTouchOnly && (
        <div className="absolute -top-12 right-0">
          <KeyboardShortcutsHint />
        </div>
      )}
    </div>
  )
}

export { TimeBrush }
