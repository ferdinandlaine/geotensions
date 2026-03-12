import { IconBrandGithub, IconLogout2 } from '@tabler/icons-react'
import type { ComponentProps } from 'react'

import { Sidebar, SidebarContent, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'

import { Button } from './ui/button'

function AppSidebar({ children, ...props }: ComponentProps<typeof Sidebar>) {
  const { logout } = useAuth()

  return (
    <Sidebar {...props}>
      <SidebarContent className="py-2">{children}</SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter>
        <Button onClick={logout} variant="ghost">
          <IconLogout2 />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
