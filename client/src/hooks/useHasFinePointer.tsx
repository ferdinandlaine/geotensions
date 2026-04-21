import { useEffect, useState } from 'react'

export function useHasFinePointer() {
  const [hasFinePointer, setHasFinePointer] = useState(
    () => window.matchMedia('(pointer: fine)').matches
  )

  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)')
    const onChange = (e: MediaQueryListEvent) => setHasFinePointer(e.matches)
    mql.addEventListener('change', onChange)

    return () => mql.removeEventListener('change', onChange)
  }, [])

  return hasFinePointer
}
