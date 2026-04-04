'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencySelect } from '@/components/common/CurrencySelect'
import { SplitInput } from './SplitInput'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useUser } from '@/hooks/useUser'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EXPENSE_CATEGORIES } from '@/lib/types/app.types'
import type { SplitType } from '@/lib/types/app.types'
import { calculateSplit, validateSplit, type SplitInput as SplitInputType } from '@/lib/utils/split'
import type { Expense, ExpenseSplit } from '@/lib/types/database.types'

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be at least 0.01'),
  currency: z.string().min(1),
  paid_by: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function ExpenseForm({
  groupId,
  defaultCurrency,
  expense,
  existingSplits,
  onSubmit,
  isSubmitting,
}: {
  groupId: string
  defaultCurrency: string
  expense?: Expense
  existingSplits?: ExpenseSplit[]
  onSubmit: (data: ExpenseFormValues & {
    split_type: SplitType
    splits: { user_id: string; amount: number }[]
  }) => void
  isSubmitting: boolean
}) {
  const { data: members = [] } = useGroupMembers(groupId)
  const { data: user } = useUser()
  const [splitType, setSplitType] = useState<SplitType>(
    (expense?.split_type as SplitType) || 'equal'
  )
  const [splitValues, setSplitValues] = useState<Record<string, number>>({})

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description ?? '',
      amount: expense ? Number(expense.amount) : undefined,
      currency: expense?.currency ?? defaultCurrency,
      paid_by: expense?.paid_by ?? user?.id ?? '',
      category: expense?.category ?? 'General',
      date: expense?.date ?? new Date().toISOString().split('T')[0],
      notes: expense?.notes ?? '',
    },
  })

  const amount = watch('amount') || 0
  const currency = watch('currency')

  // Initialize split values when members load
  useEffect(() => {
    if (members.length === 0) return

    if (existingSplits && existingSplits.length > 0) {
      // Pre-populate from existing splits
      const vals: Record<string, number> = {}
      if (splitType === 'equal') {
        members.forEach((m) => {
          vals[m.user_id] = existingSplits.some(
            (s) => s.user_id === m.user_id
          )
            ? 1
            : 0
        })
      } else {
        existingSplits.forEach((s) => {
          vals[s.user_id] = Number(s.amount)
        })
      }
      setSplitValues(vals)
    } else {
      // Default: all members included equally
      const vals: Record<string, number> = {}
      members.forEach((m) => {
        vals[m.user_id] = splitType === 'equal' ? 1 : 0
      })
      setSplitValues(vals)
    }
  }, [members, existingSplits, splitType])

  // Set paid_by to current user when user data loads
  useEffect(() => {
    if (user?.id && !expense) {
      setValue('paid_by', user.id)
    }
  }, [user, expense, setValue])

  const handleSplitTypeChange = (type: SplitType) => {
    setSplitType(type)
    const vals: Record<string, number> = {}
    members.forEach((m) => {
      vals[m.user_id] = type === 'equal' ? 1 : 0
    })
    setSplitValues(vals)
  }

  const onFormSubmit = (data: ExpenseFormValues) => {
    const splitInputs: SplitInputType[] = members.map((m) => ({
      userId: m.user_id,
      value: splitValues[m.user_id] ?? 0,
    }))

    const validation = validateSplit(splitType, data.amount, splitInputs)
    if (!validation.valid) {
      return
    }

    const computed = calculateSplit(splitType, data.amount, splitInputs)
    const splits = Object.entries(computed).map(([user_id, splitAmount]) => ({
      user_id,
      amount: splitAmount,
    }))

    onSubmit({
      ...data,
      split_type: splitType,
      splits,
    })
  }

  const splitInputs: SplitInputType[] = members.map((m) => ({
    userId: m.user_id,
    value: splitValues[m.user_id] ?? 0,
  }))
  const validation = validateSplit(splitType, amount, splitInputs)

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          className="mt-1 rounded-xl border-slate-200"
          placeholder="What was this expense for?"
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            {...register('amount', { valueAsNumber: true })}
            className="mt-1 rounded-xl border-slate-200 tabular-nums"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <Label>Currency</Label>
          <div className="mt-1">
            <CurrencySelect
              value={currency}
              onValueChange={(v) => setValue('currency', v)}
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Paid by</Label>
        <Select
          value={watch('paid_by')}
          onValueChange={(v) => v && setValue('paid_by', v)}
        >
          <SelectTrigger className="mt-1 rounded-xl border-slate-200">
            <SelectValue placeholder="Select who paid" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile.full_name ?? m.profile.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Split type</Label>
        <div className="mt-1 flex rounded-xl border border-slate-200 overflow-hidden">
          {(['equal', 'exact', 'percentage', 'shares'] as SplitType[]).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSplitTypeChange(type)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  splitType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Split details</Label>
        <SplitInput
          splitType={splitType}
          members={members}
          values={splitValues}
          onChange={setSplitValues}
          totalAmount={amount}
          currency={currency}
        />
        {!validation.valid && validation.message && (
          <p className="text-sm text-red-500 mt-2">{validation.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select
            value={watch('category')}
            onValueChange={(v) => v && setValue('category', v)}
          >
            <SelectTrigger className="mt-1 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            className="mt-1 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          className="mt-1 rounded-xl border-slate-200"
          placeholder="Any additional details..."
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !validation.valid}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
      </Button>
    </form>
  )
}
