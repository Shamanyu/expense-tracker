'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/hooks/useGroups'
import { useExpense } from '@/hooks/useExpenses'
import { useExpenseSplits } from '@/hooks/useExpenseSplits'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { updateExpense, deleteExpense } from '@/app/actions/expenses'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>
}) {
  const { id: groupId, expenseId } = use(params)
  const { data: group } = useGroup(groupId)
  const { data: expense, isLoading: expenseLoading } = useExpense(expenseId)
  const { data: splits = [], isLoading: splitsLoading } = useExpenseSplits(expenseId)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (expenseLoading || splitsLoading) return <PageSkeleton />
  if (!expense) return <div className="text-center py-12 text-slate-500">Expense not found</div>

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true)
    try {
      const result = await updateExpense(expenseId, {
        group_id: groupId,
        description: data.description as string,
        amount: data.amount as number,
        currency: data.currency as string,
        paid_by: data.paid_by as string,
        split_type: data.split_type as string,
        category: data.category as string,
        date: data.date as string,
        notes: data.notes as string | undefined,
        splits: data.splits as { user_id: string; amount: number }[],
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Expense updated!')
        queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
        router.push(`/groups/${groupId}`)
      }
    } catch {
      toast.error('Failed to update expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const result = await deleteExpense(expenseId, groupId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Expense deleted')
        queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
        router.push(`/groups/${groupId}`)
      }
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/groups/${groupId}`}
            className="text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-[22px] font-semibold text-slate-800">
            Edit Expense
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-red-500 border-red-200 hover:bg-red-50 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ExpenseForm
          groupId={groupId}
          defaultCurrency={group?.default_currency ?? 'INR'}
          expense={expense}
          existingSplits={splits}
          onSubmit={handleSubmit as never}
          isSubmitting={isSubmitting}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
            <DialogDescription>
              This will remove &quot;{expense.description}&quot; and recalculate all balances.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
