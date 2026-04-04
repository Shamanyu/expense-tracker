'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createExpense(formData: {
  group_id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  split_type: string
  category: string
  date: string
  notes?: string
  splits: { user_id: string; amount: number }[]
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: null }

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      group_id: formData.group_id,
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      paid_by: formData.paid_by,
      split_type: formData.split_type,
      category: formData.category,
      date: formData.date,
      notes: formData.notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message, data: null }

  // Insert splits
  const splits = formData.splits.map((s) => ({
    expense_id: expense.id,
    user_id: s.user_id,
    amount: s.amount,
  }))

  const { error: splitError } = await supabase
    .from('expense_splits')
    .insert(splits)

  if (splitError) return { error: splitError.message, data: null }

  revalidatePath(`/groups/${formData.group_id}`)
  return { error: null, data: expense }
}

export async function updateExpense(
  expenseId: string,
  formData: {
    group_id: string
    description: string
    amount: number
    currency: string
    paid_by: string
    split_type: string
    category: string
    date: string
    notes?: string
    splits: { user_id: string; amount: number }[]
  }
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('expenses')
    .update({
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      paid_by: formData.paid_by,
      split_type: formData.split_type,
      category: formData.category,
      date: formData.date,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId)

  if (error) return { error: error.message }

  // Delete existing splits and reinsert
  await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId)

  const splits = formData.splits.map((s) => ({
    expense_id: expenseId,
    user_id: s.user_id,
    amount: s.amount,
  }))

  const { error: splitError } = await supabase
    .from('expense_splits')
    .insert(splits)

  if (splitError) return { error: splitError.message }

  revalidatePath(`/groups/${formData.group_id}`)
  return { error: null }
}

export async function deleteExpense(expenseId: string, groupId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', expenseId)

  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  return { error: null }
}
