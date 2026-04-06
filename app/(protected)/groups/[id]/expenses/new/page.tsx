'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/hooks/useGroups'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { useCreateExpense } from '@/hooks/useCreateExpense'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: groupId } = use(params)
  const { data: group } = useGroup(groupId)
  const router = useRouter()
  const createExpenseMutation = useCreateExpense(groupId)

  const handleSubmit = (data: Record<string, unknown>) => {
    createExpenseMutation.mutate(
      {
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
      },
      {
        onSuccess: () => {
          router.push(`/groups/${groupId}`)
        },
      },
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[22px] font-semibold text-slate-100">
          Add Expense
        </h1>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5">
        <ExpenseForm
          groupId={groupId}
          defaultCurrency={group?.default_currency ?? 'INR'}
          onSubmit={handleSubmit as never}
          isSubmitting={createExpenseMutation.isPending}
        />
      </div>
    </div>
  )
}
