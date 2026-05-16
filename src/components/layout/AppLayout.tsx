import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePushNotifications()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-6 lg:px-6 lg:pt-8">
          <div className="mx-auto max-w-screen-xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
