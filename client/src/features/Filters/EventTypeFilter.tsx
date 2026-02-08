import { IconCategory, IconChevronRight } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import { fetchEventTypes } from '@/api/events'
import DevBox from '@/components/DevBox'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { EventTypeMap } from '@/types/event'

interface EventFilterProps {
  value: string[]
  onChange: (types: string[]) => void
}

/**
 * Selection semantics:
 * - [] = no filter active, nothing checked, all events shown
 * - ["Protests"] = type checked (all its subtypes)
 * - ["Peaceful protest"] = single subtype checked
 */

/** Expand compact selection to all selected subtypes */
function expand(selection: string[], eventTypes: EventTypeMap): Set<string> {
  if (!selection.length) return new Set()
  return new Set(selection.flatMap((item) => eventTypes[item] ?? [item]))
}

/** Compact selected subtypes to minimal form (type name if all its subtypes selected) */
function compact(selected: Set<string>, eventTypes: EventTypeMap): string[] {
  if (selected.size === 0) return []

  return Object.keys(eventTypes).flatMap((type) => {
    const subtypes = eventTypes[type]
    if (subtypes.every((sub) => selected.has(sub))) return [type]
    return subtypes.filter((sub) => selected.has(sub))
  })
}

function EventTypeFilter({ value, onChange }: EventFilterProps) {
  const { data: eventTypes, isLoading } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: fetchEventTypes,
    staleTime: Infinity,
  })

  function toggleType(type: string, checked: boolean) {
    if (!eventTypes) return

    const selected = expand(value, eventTypes)
    eventTypes[type].forEach((sub) => (checked ? selected.add(sub) : selected.delete(sub)))
    onChange(compact(selected, eventTypes))
  }

  function toggleSubtype(subtype: string, checked: boolean) {
    if (!eventTypes) return

    const selected = expand(value, eventTypes)

    if (checked) selected.add(subtype)
    else selected.delete(subtype)

    onChange(compact(selected, eventTypes))
  }

  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup className="px-2">
        <SidebarGroupLabel
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-2 text-sm"
          asChild
        >
          <CollapsibleTrigger>
            <IconCategory /> Event types
            <IconChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent className="p-3">
            {import.meta.env.DEV && (
              <DevBox className="mb-4">{JSON.stringify(value, null, 2)}</DevBox>
            )}

            {isLoading && <EventTypeFilterSkeleton />}

            {eventTypes &&
              Object.entries(eventTypes).map(([type, subtypes]) => {
                const isTypeActive = value.includes(type)
                const isTypePartial = !isTypeActive && subtypes.some((st) => value.includes(st))

                return (
                  <Collapsible key={type} className="group/type">
                    <div className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md">
                      <Checkbox
                        className="ml-2"
                        checked={isTypeActive ? true : isTypePartial ? 'indeterminate' : false}
                        onCheckedChange={(checked) => toggleType(type, !!checked)}
                      />

                      <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 py-1 pr-1">
                        <IconChevronRight className="size-4 shrink-0 transition-transform group-data-[state=open]/type:rotate-90" />
                        <span className="truncate" title={type}>
                          {type}
                        </span>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="ml-6">
                      {subtypes.map((subtype) => {
                        const isSubtypeActive = isTypeActive || value.includes(subtype)

                        return (
                          <label
                            key={subtype}
                            className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md py-1 pr-1"
                          >
                            <Checkbox
                              className="ml-2"
                              checked={isSubtypeActive}
                              onCheckedChange={(checked) => toggleSubtype(subtype, !!checked)}
                            />
                            <span className="truncate" title={subtype}>
                              {subtype}
                            </span>
                          </label>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function EventTypeFilterSkeleton() {
  return (
    <>
      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-38 rounded-sm" />
      </div>

      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-26 rounded-sm" />
      </div>

      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-32 rounded-sm" />
      </div>

      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-18 rounded-sm" />
      </div>

      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-24 rounded-sm" />
      </div>

      <div className="flex h-7 gap-2.5 py-1.5 pr-1 pl-2">
        <Skeleton className="w-4 rounded-sm" />
        <Skeleton className="w-16 rounded-sm" />
      </div>
    </>
  )
}

export { EventTypeFilter }
