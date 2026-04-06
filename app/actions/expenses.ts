'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { isLargeExpense, sendExpenseNotificationEmail } from '@/lib/email'
import { formatCurrency } from '@/lib/utils/currency'

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

  // Notify group members for large expenses (fire and forget)
  const large = isLargeExpense(formData.amount, formData.currency)
  console.log(`[expense-notify] amount=${formData.amount} currency=${formData.currency} isLarge=${large}`)
  if (large) {
    notifyGroupMembersOfExpense(supabase, {
      creatorId: user.id,
      groupId: formData.group_id,
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      splits: formData.splits,
    }).catch((err) => console.error('[expense-notify] failed:', err))
  }

  revalidatePath(`/groups/${formData.group_id}`)
  return { error: null, data: expense }
}

async function notifyGroupMembersOfExpense(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  opts: {
    creatorId: string
    groupId: string
    description: string
    amount: number
    currency: string
    splits: { user_id: string; amount: number }[]
  }
) {
  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', opts.groupId)
    .single()

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', opts.creatorId)
    .single()

  const adderName = creatorProfile?.full_name ?? creatorProfile?.email ?? 'Someone'
  const groupName = group?.name ?? 'a group'
  const formattedAmount = formatCurrency(opts.amount, opts.currency)

  // Get all group members except the creator
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', opts.groupId)
    .neq('user_id', opts.creatorId)

  const memberIds = (members ?? []).map((m) => m.user_id)
  console.log(`[expense-notify] group=${opts.groupId} members to notify: ${memberIds.length}`)
  if (memberIds.length === 0) return

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', memberIds)

  const splitMap = new Map(opts.splits.map((s) => [s.user_id, s.amount]))

  for (const profile of profiles ?? []) {
    const share = splitMap.get(profile.id)
    const yourShare = share ? formatCurrency(share, opts.currency) : undefined

    console.log(`[expense-notify] sending to ${profile.email}, share=${yourShare}`)
    sendExpenseNotificationEmail({
      to: profile.email,
      adderName,
      description: opts.description,
      amount: formattedAmount,
      currency: opts.currency,
      groupName,
      yourShare,
    }).catch((err) => console.error(`[expense-notify] email to ${profile.email} failed:`, err))
  }
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
