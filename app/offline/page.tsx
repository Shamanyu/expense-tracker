'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-6">
          <WifiOff className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-2">
          You're offline
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Check your internet connection and try again. Your cached data will still be available on pages you've visited before.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
