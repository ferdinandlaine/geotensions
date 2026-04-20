import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('bg-primary/10 animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
