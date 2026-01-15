import { useEffect, useRef, type RefObject } from 'react'
import { drag, type D3DragEvent } from 'd3-drag'
import { select } from 'd3-selection'

type DragHandlers<T extends Element> = {
  onStart?: (event: D3DragEvent<T, unknown, unknown>) => void
  onDrag: (event: D3DragEvent<T, unknown, unknown>) => void
  onEnd?: (event: D3DragEvent<T, unknown, unknown>) => void
}

type DragOptions = {
  /** Minimum distance in pixels before triggering drag (default: 0) */
  threshold?: number
}

export function useDragBehavior<T extends Element>(
  ref: RefObject<T | null>,
  handlers: DragHandlers<T>,
  dependencies: any[] = [],
  options: DragOptions = {}
) {
  const handlersRef = useRef(handlers)
  const { threshold = 0 } = options

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!ref.current) return

    let startX = 0
    let startY = 0
    let isDragging = false
    const thresholdSquared = threshold * threshold

    const dragBehavior = drag<T, unknown>()
      .on('start', (event) => {
        startX = event.x
        startY = event.y
        isDragging = false
        handlersRef.current.onStart?.(event)
      })
      .on('drag', (event) => {
        // Check threshold only once at the start
        if (!isDragging) {
          const dx = event.x - startX
          const dy = event.y - startY
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared >= thresholdSquared) {
            isDragging = true
          }
        }

        // Once dragging started, call onDrag for every movement
        if (isDragging) {
          handlersRef.current.onDrag(event)
        }
      })
      .on('end', (event) => {
        if (isDragging) {
          handlersRef.current.onEnd?.(event)
        }
      })

    const selection = select(ref.current)
    selection.call(dragBehavior)

    return () => {
      selection.on('.drag', null)
    }
  }, [...dependencies, threshold])
}
