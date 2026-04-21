import { IconBrandGithub } from '@tabler/icons-react'
import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { DateRangeFilter, EventTypeFilter } from '@/features/Filters'

function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()

  return (
    <Sidebar inert={!open} {...props}>
      <SidebarContent className="py-2">
        <DateRangeFilter />
        <SidebarSeparator className="mx-0" />
        <EventTypeFilter />
      </SidebarContent>

      <SidebarFooter className="inset-x-0 top-full my-2 flex items-center md:absolute">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <a
            href="https://github.com/ferdinandlaine/geotensions"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandGithub aria-hidden />
            View on GitHub
          </a>
        </Button>

        <p className="text-muted-foreground text-xs md:hidden">
          Source:{' '}
          <a
            href="https://acleddata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            ACLED
          </a>{' '}
          © {new Date().getFullYear()}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebar }
