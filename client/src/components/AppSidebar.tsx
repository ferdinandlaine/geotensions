import { IconBrandGithub } from '@tabler/icons-react'
import type { ComponentProps } from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

import { Button } from './ui/button'

function AppSidebar({ children, ...props }: ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()

  return (
    <Sidebar inert={!open} {...props}>
      <SidebarContent className="py-2">{children}</SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter className="flex items-center gap-0">
        <a
          href="https://github.com/ferdinandlaine/geotensions"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="link">
            <IconBrandGithub />
            View on GitHub
          </Button>
        </a>

        <p className="text-muted-foreground text-center text-xs">
          Sources:{' '}
          <a
            href="https://acleddata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            ACLED
          </a>{' '}
          © 2025
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
