import { IconDirectionSign } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="bg-background/75 border-accent rounded-lg border p-8 backdrop-blur-xs">
        <h1 className="mb-6 text-2xl font-semibold">Page Not Found</h1>

        <Link to="/">
          <Button className="w-full" type="button">
            <IconDirectionSign />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
