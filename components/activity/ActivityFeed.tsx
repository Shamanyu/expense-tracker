'use client'

import { useState } from 'react'
import { useActivity } from '@/hooks/useActivity'
import { ActivityItem } from './ActivityItem'
import { ListSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ActivityFeed({ limit }: { limit?: number }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useActivity(page)

  if (isLoading) return <ListSkeleton />

  const items = limit ? data?.items.slice(0, limit) : data?.items

  if (!items?.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Activity will appear here once expenses or payments are recorded."
      />
    )
  }

  return (
    <div>
      <div className="divide-y divide-slate-700">
        {items.map((item) => (
          <ActivityItem key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
      {!limit && data?.hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
