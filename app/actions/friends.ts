'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { sendInviteEmail, sendFriendRequestEmail } from '@/lib/email'

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

    if (!existingInvite) {
      const { error } = await supabase
        .from('invitations')
        .insert({
          inviter_id: user.id,
          email,
          type: 'friend',
          status: 'pending',
        })

      if (error) return { error: error.message }
    }

    // Send invite email — await so Vercel doesn't tear down before it completes
    const inviterName = currentProfile?.full_name ?? currentProfile?.email ?? 'Someone'
    await sendInviteEmail({ to: email, inviterName, type: 'friend' }).catch((err) => console.error('[friend-invite] email failed:', err))

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

  // Notify the addressee via email
  const { data: addresseeProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', profile.id)
    .single()

  if (addresseeProfile?.email) {
    const requesterName = currentProfile?.full_name ?? currentProfile?.email ?? 'Someone'
    await sendFriendRequestEmail({
      to: addresseeProfile.email,
      requesterName,
    }).catch((err) => console.error('[friend-request] email failed:', err))
  }

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

export async function resendFriendRequest(friendshipId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get the friendship
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .eq('id', friendshipId)
    .single()

  if (!friendship) return { error: 'Friend request not found' }
  if (friendship.status !== 'pending') return { error: 'This request has already been accepted' }
  if (friendship.requester_id !== user.id) return { error: 'You can only resend your own requests' }

  // Get both profiles for the email
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const { data: addresseeProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', friendship.addressee_id)
    .single()

  if (!addresseeProfile?.email) return { error: 'Could not find recipient email' }

  const requesterName = requesterProfile?.full_name ?? requesterProfile?.email ?? 'Someone'
  await sendFriendRequestEmail({
    to: addresseeProfile.email,
    requesterName,
  }).catch(() => {})

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
