import { drag } from 'd3-drag'
import type { ScaleTime } from 'd3-scale'
import { select } from 'd3-selection'
import { type MouseEvent, useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

const OVERVIEW_HEIGHT = 14

interface OverviewProps {
  xScale: ScaleTime<number, number>
  visibleDomain: [Date, Date]
  selectedRange: { from: Date; to: Date }
  className?: string
  onTeleport: (domain: [Date, Date]) => void
}

function Overview({ xScale, visibleDomain, selectedRange, className, onTeleport }: OverviewProps) {
  const viewportRef = useRef<SVGRectElement>(null)
  const onTeleportRef = useRef(onTeleport)
  const visibleDomainRef = useRef(visibleDomain)

  const [rangeStart, rangeEnd] = xScale.range() as [number, number]
  const width = rangeEnd - rangeStart
  const [domainStart, domainEnd] = xScale.domain() as [Date, Date]

  useEffect(() => {
    onTeleportRef.current = onTeleport
    visibleDomainRef.current = visibleDomain
  }, [onTeleport, visibleDomain])

  // Clamp domain to coverage bounds, preserving duration
  const clampDomain = useCallback(
    (start: Date, end: Date): [Date, Date] => {
      const duration = end.getTime() - start.getTime()

      if (start < domainStart) return [domainStart, new Date(domainStart.getTime() + duration)]
      if (end > domainEnd) return [new Date(domainEnd.getTime() - duration), domainEnd]

      return [start, end]
    },
    [domainStart, domainEnd]
  )

  // Drag behavior on viewport indicator
  useEffect(() => {
    const viewportElement = viewportRef.current
    if (!viewportElement) return

    let dragStartX: number
    let initialDomain: [Date, Date]

    const dragBehavior = drag<SVGRectElement, unknown>()
      .on('start', (event) => {
        dragStartX = event.x
        initialDomain = [...visibleDomainRef.current]
      })
      .on('drag', (event) => {
        const dx = event.x - dragStartX
        const pixelToMs = (domainEnd.getTime() - domainStart.getTime()) / width
        const deltaMs = dx * pixelToMs

        const [cStart, cEnd] = clampDomain(
          new Date(initialDomain[0].getTime() + deltaMs),
          new Date(initialDomain[1].getTime() + deltaMs)
        )

        onTeleportRef.current([cStart, cEnd])
      })

    select(viewportElement).call(dragBehavior)

    return () => {
      select(viewportElement).on('.drag', null)
    }
  }, [width, xScale, clampDomain, domainStart, domainEnd])

  // Click background → teleport center
  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    // Ignore clicks that originated from the viewport drag
    if ((event.target as Element).classList.contains('overview-viewport')) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickDate = xScale.invert(event.clientX - rect.left)
    const halfDuration = (visibleDomain[1].getTime() - visibleDomain[0].getTime()) / 2

    const [cStart, cEnd] = clampDomain(
      new Date(clickDate.getTime() - halfDuration),
      new Date(clickDate.getTime() + halfDuration)
    )

    onTeleport([cStart, cEnd])
  }

  // Viewport indicator
  const viewportX = xScale(visibleDomain[0])
  const viewportWidth = xScale(visibleDomain[1]) - viewportX

  // Selected range indicator
  const selectionX = xScale(selectedRange.from)
  const selectionWidth = Math.max(2, xScale(selectedRange.to) - selectionX)

  return (
    <svg
      width={width}
      height={OVERVIEW_HEIGHT}
      overflow="visible"
      className={cn('overview cursor-pointer', className)}
      onClick={handleClick}
    >
      <rect x={0} y={0} width={width} height={OVERVIEW_HEIGHT} className="overview-track" />
      <rect
        x={selectionX + 0.5}
        y={0.5}
        width={selectionWidth - 1}
        height={OVERVIEW_HEIGHT - 1}
        className="overview-selection pointer-events-none"
      />
      <rect
        ref={viewportRef}
        x={viewportX}
        y={0}
        width={viewportWidth}
        height={OVERVIEW_HEIGHT}
        className="overview-viewport cursor-move"
      />
    </svg>
  )
}

export default Overview
