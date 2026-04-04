'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

export function UserAvatar({
  profile,
  className,
}: {
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'email'>
  className?: string
}) {
  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? 'User'} />
      <AvatarFallback className="bg-indigo-600 text-white text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
