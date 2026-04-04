'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function updateProfile(formData: {
  full_name: string
  default_currency: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.full_name,
      default_currency: formData.default_currency,
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/account')
}

export async function deleteAccount() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Delete profile (cascade handles related data)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (error) throw error

  await supabase.auth.signOut()
}
