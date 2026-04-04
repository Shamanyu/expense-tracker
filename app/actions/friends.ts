'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/email'

export async function sendFriendRequest(email: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Can't add yourself
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  if (currentProfile?.email === email) {
    return { error: "You can't send a friend request to yourself." }
  }

  // Look up profile by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) {
    // User not on Settl yet — create an invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('inviter_id', user.id)
      .eq('email', email)
      .eq('type', 'friend')
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return { error: 'You already have a pending invite for this email.' }
    }

    const { error } = await supabase
      .from('invitations')
      .insert({
        inviter_id: user.id,
        email,
        type: 'friend',
        status: 'pending',
      })

    if (error) return { error: error.message }

    // Send invite email (fire and forget)
    const inviterName = currentProfile?.full_name ?? currentProfile?.email ?? 'Someone'
    sendInviteEmail({ to: email, inviterName, type: 'friend' }).catch(() => {})

    revalidatePath('/friends')
    return { error: null, invited: true }
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
  return { error: null, invited: false }
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
