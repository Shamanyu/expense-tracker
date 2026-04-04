'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/hooks/useGroups'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { createExpense } from '@/app/actions/expenses'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: Parameters<typeof createExpense>[0]['splits'] extends infer _ ? Record<string, unknown> : never) => {
    setIsSubmitting(true)
    try {
      const result = await createExpense({
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
        toast.success('Expense added!')
        queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
        queryClient.invalidateQueries({ queryKey: ['activity'] })
        router.push(`/groups/${groupId}`)
      }
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[22px] font-semibold text-slate-800">
          Add Expense
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ExpenseForm
          groupId={groupId}
          defaultCurrency={group?.default_currency ?? 'USD'}
          onSubmit={handleSubmit as never}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
