import { type RefObject, useEffect, useRef } from 'react'

type WheelHandler = {
  onWheel: (delta: number) => void
}

type WheelOptions = {
  canScrollUp?: boolean
  canScrollDown?: boolean
}

/** Reusable wheel event handler hook */
export function useWheel<T extends Element>(
  target: RefObject<T | null> | T | null,
  handler: WheelHandler,
  options: WheelOptions = {}
) {
  const handlerRef = useRef(handler)
  const { canScrollUp = true, canScrollDown = true } = options

  useEffect(() => {
    const element = target && 'current' in target ? target.current : target
    if (!element) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()

      // Normalize wheel delta (varies across browsers/trackpads)
      const delta = -Math.sign(event.deltaY)

      // Validate constraints
      if (delta > 0 && !canScrollUp) return
      if (delta < 0 && !canScrollDown) return

      handlerRef.current.onWheel(delta)
    }

    element.addEventListener('wheel', handleWheel as EventListener, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel as EventListener)
  }, [target, canScrollUp, canScrollDown])

  useEffect(() => {
    handlerRef.current = handler
  })
}
