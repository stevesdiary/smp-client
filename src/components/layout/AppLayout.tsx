import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePushNotifications()

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-5rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-200/10" />
      </div>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 lg:px-6 lg:pb-8 lg:pt-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
