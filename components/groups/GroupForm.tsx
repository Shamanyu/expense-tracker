'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/common/CurrencySelect'

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
  onSubmit: (data: GroupFormValues) => void
  isSubmitting: boolean
}) {
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
      default_currency: 'USD',
      ...defaultValues,
    },
  })

  const currency = watch('default_currency')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
