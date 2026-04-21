import { IconQuestionMark } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

const isMac = navigator.platform.startsWith('Mac')
const META = isMac ? '⌘ Cmd' : 'Ctrl'
const ALT = isMac ? '⌥ Option' : 'Alt'

export function KeyboardShortcutsHint() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <IconQuestionMark />
        </Button>
      </PopoverTrigger>

      <PopoverContent side="left" sideOffset={16} align="end" className="text-sm md:w-fit">
        <PopoverHeader className="mb-4">
          <PopoverTitle className="text-lg">Keyboard shortcuts</PopoverTitle>
          <PopoverDescription>
            Jump to the timeline with <Kbd>⇥ Tab</Kbd>, back to the map with <Kbd>⇧ Shift</Kbd> +{' '}
            <Kbd>⇥ Tab</Kbd>
          </PopoverDescription>
        </PopoverHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-muted-foreground mb-1.5 font-semibold tracking-wide uppercase">
              Selection
            </p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup>
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </KbdGroup>
              <span>Move by 1 day</span>

              <KbdGroup>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              <span>Extend / shorten by 1 day</span>

              <KbdGroup className="text-muted-foreground">
                <Kbd>⇧ Shift</Kbd> + <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </KbdGroup>
              <span>Move by selection</span>

              <KbdGroup className="text-muted-foreground">
                <Kbd>⇧ Shift</Kbd> + <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              <span>Resize by week</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground mb-1.5 font-semibold tracking-wide uppercase">
              Viewport
            </p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup className="text-muted-foreground">
                <Kbd>{ALT}</Kbd> + <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </KbdGroup>
              <span>Pan</span>

              <KbdGroup className="text-muted-foreground">
                <Kbd>{ALT}</Kbd> + <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              <span>Zoom in / out</span>
            </div>

            <p className="text-muted-foreground italic">
              Hold <Kbd>⇧ Shift</Kbd> for larger steps
            </p>
          </div>

          <div className="space-y-4 md:col-span-2">
            <p className="text-muted-foreground mb-1.5 font-semibold tracking-wide uppercase">
              Mouse
            </p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup className="text-muted-foreground">
                <Kbd>{ALT}</Kbd> + <Kbd>drag</Kbd>
              </KbdGroup>
              <span>Center selection on date</span>

              <KbdGroup className="text-muted-foreground">
                <Kbd>{META}</Kbd> + <Kbd>drag</Kbd>
              </KbdGroup>
              <span>Re-select</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
