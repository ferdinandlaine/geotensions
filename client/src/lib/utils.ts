import { type ClassValue, clsx } from 'clsx'
import type { DateRange as RDPDateRange } from 'react-day-picker'
import { twMerge } from 'tailwind-merge'

import type { DateRange } from '@/types/filter'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidDateRange(value: RDPDateRange | undefined): value is DateRange {
  return value?.from !== undefined && value?.to !== undefined
}
