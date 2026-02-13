import { type RefObject, useEffect, useRef } from 'react'

type ResizeHandlers = {
  onResize: (width: number) => void
}

export function useResizeObserver<T extends Element>(
  target: RefObject<T | null> | T | null,
  handler: ResizeHandlers
) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    const element = target && 'current' in target ? target.current : target
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      handlerRef.current.onResize(Math.round(entry.contentRect.width))
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [target])

  useEffect(() => {
    handlerRef.current = handler
  })
}
