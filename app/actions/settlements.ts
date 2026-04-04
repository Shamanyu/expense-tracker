'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function recordSettlement(formData: {
  group_id: string
  payer_id: string
  payee_id: string
  amount: number
  currency: string
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('settlements')
    .insert({
      group_id: formData.group_id,
      payer_id: formData.payer_id,
      payee_id: formData.payee_id,
      amount: formData.amount,
      currency: formData.currency,
      notes: formData.notes || null,
      created_by: user.id,
    })

  if (error) throw error
  revalidatePath(`/settle/${formData.group_id}`)
  revalidatePath(`/groups/${formData.group_id}`)
}
