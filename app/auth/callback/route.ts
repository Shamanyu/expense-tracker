import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Process pending invitations for this user
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await processPendingInvitations(supabase, user.id, user.email)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${new URL(request.url).origin}/auth/auth-code-error`)
}

async function processPendingInvitations(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string
) {
  try {
    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')

    if (!invitations?.length) return

    for (const invite of invitations) {
      if (invite.type === 'friend') {
        // Create friendship
        await supabase.from('friendships').insert({
          requester_id: invite.inviter_id,
          addressee_id: userId,
          status: 'pending',
        })
      } else if (invite.type === 'group' && invite.group_id) {
        // Add to group
        await supabase.from('group_members').insert({
          group_id: invite.group_id,
          user_id: userId,
          role: 'member',
        })
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id)
    }
  } catch {
    // Don't block login if invitation processing fails
  }
}
