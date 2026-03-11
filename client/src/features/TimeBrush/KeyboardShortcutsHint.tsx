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

      <PopoverContent side="right" sideOffset={16} align="end" className="w-fit">
        <PopoverHeader className="mb-4">
          <PopoverTitle className="text-lg">Shortcuts</PopoverTitle>
          <PopoverDescription>
            <Kbd>⇥ Tab</Kbd> into the timeline, then use shortcuts below
          </PopoverDescription>
        </PopoverHeader>

        <div className="text-muted-foreground space-y-4 text-sm">
          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">Selection</p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup>
                <Kbd>&larr;</Kbd>
                <Kbd>&rarr;</Kbd>
              </KbdGroup>
              <span>Move by 1 day</span>

              <KbdGroup>
                <Kbd>&uarr;</Kbd>
                <Kbd>&darr;</Kbd>
              </KbdGroup>
              <span>Extend / shorten by 1 day</span>

              <KbdGroup>
                <Kbd>⇧ Shift</Kbd> + <Kbd>&larr;</Kbd>
                <Kbd>&rarr;</Kbd>
              </KbdGroup>
              <span>Move by selection</span>

              <KbdGroup>
                <Kbd>⇧ Shift</Kbd> + <Kbd>&uarr;</Kbd>
                <Kbd>&darr;</Kbd>
              </KbdGroup>
              <span>Resize by week</span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">Viewport</p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup>
                <Kbd>{ALT}</Kbd> + <Kbd>&larr;</Kbd>
                <Kbd>&rarr;</Kbd>
              </KbdGroup>
              <span>Pan</span>

              <KbdGroup>
                <Kbd>{ALT}</Kbd> + <Kbd>&uarr;</Kbd>
                <Kbd>&darr;</Kbd>
              </KbdGroup>
              <span>Zoom in / out</span>
            </div>

            <p className="mt-2 italic">
              Hold <Kbd>⇧ Shift</Kbd> for larger steps
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">Mouse</p>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <KbdGroup>
                <Kbd>{ALT}</Kbd> + <Kbd>drag</Kbd>
              </KbdGroup>
              <span>Center selection on date</span>

              <KbdGroup>
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
