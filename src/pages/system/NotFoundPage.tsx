import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPinned className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
