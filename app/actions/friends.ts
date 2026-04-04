'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function sendFriendRequest(email: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Look up profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    return { error: 'No account found with that email.' }
  }

  if (profile.id === user.id) {
    return { error: "You can't send a friend request to yourself." }
  }

  // Check existing friendship
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
    )
    .single()

  if (existing) {
    return { error: 'A friend request already exists with this user.' }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: profile.id,
      status: 'pending',
    })

  if (error) return { error: error.message }
  revalidatePath('/friends')
  return { error: null }
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)

  if (error) return { error: error.message }
  revalidatePath('/friends')
  return { error: null }
}

export async function declineFriendRequest(friendshipId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) return { error: error.message }
  revalidatePath('/friends')
  return { error: null }
}
