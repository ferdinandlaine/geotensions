import type { ComponentProps } from 'react'

import { Sidebar, SidebarContent } from '@/components/ui/sidebar'

function AppSidebar({ children, ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarContent className="py-2">{children}</SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
