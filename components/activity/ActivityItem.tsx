'use client'

import Link from 'next/link'
import { UserAvatar } from '@/components/common/UserAvatar'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityItemWithImpact } from '@/hooks/useActivity'
import { cn } from '@/lib/utils'

export function ActivityItem({ item }: { item: ActivityItemWithImpact }) {
  // Color based on user impact
  const impactColor =
    item.userImpact > 0.01
      ? 'border-l-indigo-500 bg-indigo-950/30' // you're owed
      : item.userImpact < -0.01
        ? 'border-l-red-500 bg-red-950/20' // you owe
        : 'border-l-slate-600 bg-slate-800/30' // neutral

  const amountColor =
    item.userImpact > 0.01
      ? 'text-indigo-400'
      : item.userImpact < -0.01
        ? 'text-red-400'
        : 'text-slate-400'

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-3 px-3 rounded-xl border-l-[3px] my-1',
        impactColor
      )}
    >
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
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className={cn('text-sm font-medium tabular-nums', amountColor)}>
          {formatCurrency(item.amount, item.currency)}
        </span>
        {Math.abs(item.userImpact) > 0.01 && (
          <p className={cn('text-[11px] tabular-nums', amountColor)}>
            {item.userImpact > 0 ? 'you lent' : 'you owe'}{' '}
            {formatCurrency(Math.abs(item.userImpact), item.currency)}
          </p>
        )}
      </div>
    </div>
  )
}
