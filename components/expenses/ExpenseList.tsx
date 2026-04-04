'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useUser } from '@/hooks/useUser'
import { ExpenseItem } from './ExpenseItem'
import { ListSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExpenseList({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1)
  const { data: user } = useUser()
  const { data, isLoading } = useExpenses(groupId, page)
  const { data: members = [] } = useGroupMembers(groupId)

  const profileMap = new Map(
    members.map((m) => [m.user_id, m.profile])
  )

  if (isLoading) return <ListSkeleton />

  if (!data?.data.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add your first expense to start splitting costs."
      />
    )
  }

  const totalPages = Math.ceil((data.count ?? 0) / 20)

  return (
    <div>
      <div className="divide-y divide-slate-100">
        {data.data.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            paidByProfile={profileMap.get(expense.paid_by)}
            currentUserId={user?.id ?? ''}
            groupId={groupId}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
