'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/email'

export async function createGroup(formData: {
  name: string
  description?: string
  default_currency: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: null }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: formData.name,
      description: formData.description || null,
      default_currency: formData.default_currency,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message, data: null }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) return { error: memberError.message, data: null }

  revalidatePath('/groups')
  return { error: null, data: group }
}

export async function updateGroup(
  groupId: string,
  formData: {
    name: string
    description?: string
    default_currency: string
  }
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('groups')
    .update({
      name: formData.name,
      description: formData.description || null,
      default_currency: formData.default_currency,
    })
    .eq('id', groupId)

  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  return { error: null }
}

export async function archiveGroup(groupId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('groups')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) return { error: error.message }
  revalidatePath('/groups')
  return { error: null }
}

export async function addMember(groupId: string, email: string) {
  const supabase = await createServerClient()

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
      .eq('email', email)
      .eq('type', 'group')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return { error: 'This email already has a pending invite to this group.' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('invitations')
      .insert({
        inviter_id: user.id,
        email,
        type: 'group',
        group_id: groupId,
        status: 'pending',
      })

    if (error) return { error: error.message }

    // Send invite email (fire and forget)
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    const inviterName = inviterProfile?.full_name ?? inviterProfile?.email ?? 'Someone'
    sendInviteEmail({
      to: email,
      inviterName,
      type: 'group',
      groupName: group?.name,
    }).catch(() => {})

    revalidatePath(`/groups/${groupId}`)
    return { error: null, invited: true }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .single()

  if (existing) {
    return { error: 'This user is already a member of the group.' }
  }

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: profile.id,
      role: 'member',
    })

  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  return { error: null, invited: false }
}

export async function removeMember(groupId: string, memberId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  return { error: null }
}
