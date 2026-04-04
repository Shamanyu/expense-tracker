'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/common/CurrencySelect'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useFriends } from '@/hooks/useFriends'
import { X, Search, UserPlus, Mail } from 'lucide-react'

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  default_currency: z.string().min(1),
})

type GroupFormValues = z.infer<typeof groupSchema>

type SelectedMember = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  isEmailOnly?: boolean
}

export function GroupForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<GroupFormValues>
  onSubmit: (data: GroupFormValues & { memberEmails?: string[] }) => void
  isSubmitting: boolean
}) {
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: friends = [] } = useFriends()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      description: '',
      default_currency: 'INR',
      ...defaultValues,
    },
  })

  const currency = watch('default_currency')

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const acceptedFriends = friends.filter((f) => f.status === 'accepted' || f.status === 'group_friend')

  const filteredFriends = acceptedFriends.filter((f) => {
    if (selectedMembers.some((m) => m.id === f.profile.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (f.profile.full_name?.toLowerCase().includes(q)) ||
      f.profile.email.toLowerCase().includes(q)
    )
  })

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

  const searchIsEmail = isValidEmail(search)
  const emailAlreadySelected = selectedMembers.some(
    (m) => m.email.toLowerCase() === search.trim().toLowerCase()
  )
  const emailIsFriend = acceptedFriends.some(
    (f) => f.profile.email.toLowerCase() === search.trim().toLowerCase()
  )
  // Show "invite by email" option when search is a valid email not already selected and not matching a friend exactly
  const showInviteByEmail = searchIsEmail && !emailAlreadySelected && !emailIsFriend

  const addFriend = (friend: typeof acceptedFriends[0]) => {
    setSelectedMembers((prev) => [
      ...prev,
      {
        id: friend.profile.id,
        name: friend.profile.full_name ?? friend.profile.email,
        email: friend.profile.email,
        avatar_url: friend.profile.avatar_url,
      },
    ])
    setSearch('')
    setShowDropdown(false)
  }

  const addByEmail = (email: string) => {
    const trimmed = email.trim()
    setSelectedMembers((prev) => [
      ...prev,
      {
        id: `email-${trimmed}`,
        name: trimmed,
        email: trimmed,
        avatar_url: null,
        isEmailOnly: true,
      },
    ])
    setSearch('')
    setShowDropdown(false)
  }

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const onFormSubmit = (data: GroupFormValues) => {
    const emails = selectedMembers.map((m) => m.email)
    onSubmit({ ...data, memberEmails: emails.length > 0 ? emails : undefined })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          {...register('name')}
          className="mt-1 rounded-xl border-slate-700 bg-slate-900"
          placeholder="e.g. Trip to Bali"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          {...register('description')}
          className="mt-1 rounded-xl border-slate-700 bg-slate-900"
          placeholder="What's this group for?"
        />
      </div>

      <div>
        <Label>Default Currency</Label>
        <div className="mt-1">
          <CurrencySelect
            value={currency}
            onValueChange={(v) => setValue('default_currency', v)}
          />
        </div>
      </div>

      <div>
        <Label>Add Members</Label>
        <div className="mt-1 space-y-2">
          {/* Selected members chips */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((m) => (
                <span
                  key={m.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${
                    m.isEmailOnly
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-indigo-950 text-indigo-300'
                  }`}
                >
                  {m.isEmailOnly ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <UserAvatar
                      profile={{ full_name: m.name, email: m.email, avatar_url: m.avatar_url } as any}
                      className="h-5 w-5"
                    />
                  )}
                  {m.name}
                  {m.isEmailOnly && (
                    <span className="text-[10px] opacity-70">(invite)</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Friend search / email input */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && showInviteByEmail) {
                    e.preventDefault()
                    addByEmail(search)
                  }
                }}
                className="pl-9 rounded-xl border-slate-700 bg-slate-900"
                placeholder="Search friends or type an email..."
              />
            </div>
            {showDropdown && (search.trim() || filteredFriends.length > 0) && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
                {/* Friend matches */}
                {filteredFriends.map((f) => (
                  <button
                    key={f.profile.id}
                    type="button"
                    onClick={() => addFriend(f)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <UserAvatar profile={f.profile} className="h-7 w-7" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {f.profile.full_name ?? f.profile.email}
                      </p>
                      {f.profile.full_name && (
                        <p className="text-xs text-slate-500 truncate">{f.profile.email}</p>
                      )}
                    </div>
                    <UserPlus className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                ))}

                {/* Invite by email option */}
                {showInviteByEmail && (
                  <button
                    type="button"
                    onClick={() => addByEmail(search)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors text-left border-t border-slate-700"
                  >
                    <div className="h-7 w-7 rounded-full bg-amber-900/50 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        Invite {search.trim()}
                      </p>
                      <p className="text-xs text-slate-500">Send an invite to join the group</p>
                    </div>
                  </button>
                )}

                {/* Empty state */}
                {filteredFriends.length === 0 && !showInviteByEmail && (
                  <div className="px-3 py-3 text-sm text-slate-500 text-center">
                    {search.trim()
                      ? 'No matching friends — type a full email to invite'
                      : 'Type to search friends or enter an email'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        {isSubmitting ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  )
}
