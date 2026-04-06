'use client'

import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff } from 'lucide-react'

export function AppShell({ children }: { children: ReactNode }) {
  const isOnline = useNetworkStatus()

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        {!isOnline && (
          <div className="bg-amber-900/50 border-b border-amber-800 px-4 py-2.5 flex items-center gap-2 text-amber-300 text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>You&apos;re offline. Changes will sync when you reconnect.</span>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
