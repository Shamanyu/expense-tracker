'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/common/CurrencySelect'
import { UserAvatar } from '@/components/common/UserAvatar'
import { updateProfile, deleteAccount } from '@/app/actions/account'
import { callServerAction } from '@/lib/utils/serverAction'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { Separator } from '@/components/ui/separator'
import { LogOut, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function AccountPage() {
  const { data: user, isLoading } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [currency, setCurrency] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (user && !initialized) {
    setFullName(user.full_name ?? '')
    setCurrency(user.default_currency)
    setInitialized(true)
  }

  if (isLoading) return <PageSkeleton />
  if (!user) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await callServerAction(() => updateProfile({ full_name: fullName, default_currency: currency }))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated!')
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    try {
      const result = await callServerAction(() => deleteAccount())
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.push('/')
      }
    } catch {
      toast.error('Network error — try again when online')
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-[22px] font-semibold text-slate-100">Account</h1>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-4">
          <UserAvatar profile={user} className="h-14 w-14 text-lg" />
          <div>
            <p className="font-medium text-slate-100">
              {user.full_name ?? 'No name set'}
            </p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        <div>
          <Label htmlFor="fullName">Display Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 rounded-xl border-slate-700 bg-slate-900"
          />
        </div>

        <div>
          <Label>Default Currency</Label>
          <div className="mt-1">
            <CurrencySelect value={currency} onValueChange={setCurrency} />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      <div className="bg-slate-800 rounded-2xl border border-red-900/50 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-red-400 border-red-900/50 hover:bg-red-950 rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete My Account
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your profile and all associated data
              including group memberships, expenses, and settlements. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
