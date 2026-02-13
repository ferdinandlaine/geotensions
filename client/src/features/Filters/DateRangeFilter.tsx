import { IconCalendarEvent, IconChevronRight } from '@tabler/icons-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import DevBox from '@/components/DevBox'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar'
import { TIME_CONFIG } from '@/config/time'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange | undefined) => void
}

function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup className="px-2">
        <SidebarGroupLabel
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-2 text-sm"
          asChild
        >
          <CollapsibleTrigger>
            <IconCalendarEvent /> Time Period
            <IconChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent className="p-3">
            {import.meta.env.DEV && (
              <DevBox className="mb-4">
                {JSON.stringify(
                  {
                    from: value.from && format(value.from, 'yyyy-MM-dd'),
                    to: value.to && format(value.to, 'yyyy-MM-dd'),
                  },
                  null,
                  2
                )}
              </DevBox>
            )}

            <Calendar
              mode="range"
              selected={value}
              onSelect={onChange}
              captionLayout="dropdown"
              startMonth={COVERAGE_START_DATE}
              endMonth={COVERAGE_END_DATE}
              className="w-full p-0"
              defaultMonth={value.from}
              disabled={(date: Date) => date < COVERAGE_START_DATE || date > COVERAGE_END_DATE}
            />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export { DateRangeFilter }
