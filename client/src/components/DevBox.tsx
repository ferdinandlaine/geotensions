import type { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

function DevBox({ children, className }: PropsWithChildren<{ className: string }>) {
  return (
    <pre className={cn('bg-accent overflow-auto rounded-md border px-2 py-1.5 text-xs', className)}>
      {children}
    </pre>
  )
}

export default DevBox
