import { type D3DragEvent, drag } from 'd3-drag'
import { select } from 'd3-selection'
import { type RefObject, useEffect, useRef } from 'react'

type DragHandlers<T extends Element> = {
  onStart?: (event: D3DragEvent<T, unknown, unknown>) => void
  onDrag: (event: D3DragEvent<T, unknown, unknown>) => void
  onEnd?: (event: D3DragEvent<T, unknown, unknown>) => void
}

type DragOptions = {
  /** Minimum distance in px before onDrag is triggered (default: 0) */
  threshold?: number
}

/** Reusable drag event handler hook using D3 */
export function useDrag<T extends Element>(
  target: RefObject<T | null> | T | null,
  handlers: DragHandlers<T>,
  options: DragOptions = {}
) {
  const handlersRef = useRef(handlers)
  const { threshold = 0 } = options

  useEffect(() => {
    const element = target && 'current' in target ? target.current : target
    if (!element) return

    let hasDragged = false
    let startX = 0
    let startY = 0

    const dragBehavior = drag<T, unknown>()
      .on('start', (event) => {
        hasDragged = false
        startX = event.x
        startY = event.y

        handlersRef.current.onStart?.(event)
      })
      .on('drag', (event) => {
        if (!hasDragged) {
          const dx = event.x - startX
          const dy = event.y - startY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < threshold) return
          hasDragged = true
        }

        handlersRef.current.onDrag(event)
      })
      .on('end', (event) => handlersRef.current.onEnd?.(event))

    const selection = select(element)
    selection.call(dragBehavior)

    return () => {
      selection.on('.drag', null)
    }
  }, [target, threshold])

  useEffect(() => {
    handlersRef.current = handlers
  })
}
