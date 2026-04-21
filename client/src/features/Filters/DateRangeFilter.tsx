import { IconCalendarEvent, IconChevronRight } from '@tabler/icons-react'
import type { DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar'
import { TIME_CONFIG } from '@/config/time'
import { useFilters } from '@/contexts/FiltersContext'
import { isValidDateRange } from '@/types/filter'

const { COVERAGE_START_DATE, COVERAGE_END_DATE } = TIME_CONFIG

function DateRangeFilter() {
  const { dateRange: value, setDateRange } = useFilters()

  const onChange = (range: DateRange | undefined) => {
    if (isValidDateRange(range)) setDateRange(range)
  }

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
