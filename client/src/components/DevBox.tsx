import type { PropsWithChildren } from 'react'

function DevBox({ children }: PropsWithChildren) {
  return (
    <pre className="bg-background text-foreground rounded-md border px-2 py-1.5 text-xs">
      {children}
    </pre>
  )
}

export default DevBox
