'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/common/CurrencySelect'
import { Plus, X } from 'lucide-react'

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  default_currency: z.string().min(1),
})

type GroupFormValues = z.infer<typeof groupSchema>

export function GroupForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<GroupFormValues>
  onSubmit: (data: GroupFormValues & { memberEmails?: string[] }) => void
  isSubmitting: boolean
}) {
  const [memberEmails, setMemberEmails] = useState<string[]>([''])

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

  const addEmailField = () => setMemberEmails([...memberEmails, ''])
  const removeEmailField = (idx: number) =>
    setMemberEmails(memberEmails.filter((_, i) => i !== idx))
  const updateEmail = (idx: number, value: string) => {
    const updated = [...memberEmails]
    updated[idx] = value
    setMemberEmails(updated)
  }

  const onFormSubmit = (data: GroupFormValues) => {
    const emails = memberEmails.filter((e) => e.trim().length > 0)
    onSubmit({ ...data, memberEmails: emails })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          {...register('name')}
          className="mt-1 rounded-xl border-slate-200"
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
          className="mt-1 rounded-xl border-slate-200"
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
        <Label>Add Members (optional)</Label>
        <div className="mt-1 space-y-2">
          {memberEmails.map((email, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(idx, e.target.value)}
                className="flex-1 rounded-xl border-slate-200"
                placeholder="friend@email.com"
              />
              {memberEmails.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEmailField(idx)}
                  className="rounded-xl px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmailField}
            className="rounded-xl text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add another
          </Button>
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
