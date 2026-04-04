'use client'

import Link from 'next/link'
import { UserAvatar } from '@/components/common/UserAvatar'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityItem as ActivityItemType } from '@/lib/types/app.types'

export function ActivityItem({ item }: { item: ActivityItemType }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <UserAvatar profile={item.actor} className="h-9 w-9 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">
          <span className="font-medium">
            {item.actor.full_name ?? item.actor.email}
          </span>{' '}
          {item.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Link
            href={`/groups/${item.group_id}`}
            className="text-xs text-indigo-400 hover:underline"
          >
            {item.group_name}
          </Link>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium tabular-nums text-slate-300 shrink-0">
        {formatCurrency(item.amount, item.currency)}
      </span>
    </div>
  )
}
