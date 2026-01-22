import type { PropsWithChildren } from 'react'

function DevBox({ children }: PropsWithChildren) {
  return (
    <pre className="card bg-neutral-900/75 px-2 py-1.5 text-xs text-neutral-100">
      {children}
    </pre>
  )
}

export default DevBox
