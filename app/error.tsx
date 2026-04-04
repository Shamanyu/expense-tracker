'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="rounded-full bg-red-100 p-4 mb-4 inline-flex">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
