'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createGroup(formData: {
  name: string
  description?: string
  default_currency: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

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

  if (error) throw error

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) throw memberError

  revalidatePath('/groups')
  return group
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

  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}

export async function archiveGroup(groupId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('groups')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) throw error
  revalidatePath('/groups')
}

export async function addMember(groupId: string, email: string) {
  const supabase = await createServerClient()

  // Look up profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('No account found with that email.')
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .single()

  if (existing) {
    throw new Error('This user is already a member of the group.')
  }

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: profile.id,
      role: 'member',
    })

  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}

export async function removeMember(groupId: string, memberId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}
