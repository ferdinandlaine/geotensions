import { type ClassValue, clsx } from 'clsx'
import type { DateRange } from 'react-day-picker'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidDateRange(range: DateRange | undefined): range is DateRange {
  return range?.from !== undefined && range?.to !== undefined
}
