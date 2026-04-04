'use client'

import { ActivityFeed } from '@/components/activity/ActivityFeed'

export default function ActivityPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-[22px] font-semibold text-slate-800">Activity</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <ActivityFeed />
      </div>
    </div>
  )
}
