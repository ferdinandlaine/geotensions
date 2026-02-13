import { axisBottom } from 'd3-axis'
import type { ScaleTime } from 'd3-scale'
import { select } from 'd3-selection'
import { useEffect, useRef } from 'react'

interface TimeAxisProps {
  xScale: ScaleTime<number, number>
}

function TimeAxis({ xScale }: TimeAxisProps) {
  const axisGroupRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!axisGroupRef.current) return

    const axisGroup = select(axisGroupRef.current)
    const width = xScale.range()[1]
    const xAxis = axisBottom(xScale)
      .ticks(Math.floor(width / 100)) // ~100px min spacing to prevent label overlap
      .tickSize(8)
      .tickPadding(8)

    axisGroup.call(xAxis)
  }, [xScale])

  return (
    <svg width="100%" height={26} overflow="visible">
      <g ref={axisGroupRef} className="time-axis" />
    </svg>
  )
}

export default TimeAxis
