import type { Profile, Group, GroupMember, Expense, ExpenseSplit, Settlement } from './database.types'

export type GroupWithMeta = Group & {
  member_count: number
  your_balance: number
  last_activity: string | null
}

export type GroupMemberWithProfile = GroupMember & {
  profile: Profile
}

export type ExpenseWithDetails = Expense & {
  paid_by_profile: Profile
  splits: (ExpenseSplit & { profile: Profile })[]
}

export type SettlementWithProfiles = Settlement & {
  payer_profile: Profile
  payee_profile: Profile
}

export type FriendWithBalance = {
  profile: Profile
  net_balance: number
  friendship_id: string
  status: 'pending' | 'accepted'
  is_requester: boolean
}

export type ActivityItem = {
  id: string
  type: 'expense_added' | 'expense_updated' | 'expense_deleted' | 'settlement'
  actor: Profile
  group_id: string
  group_name: string
  description: string
  amount: number
  currency: string
  created_at: string
}

export type DebtSimplification = {
  from: string
  to: string
  amount: number
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares'

export const EXPENSE_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Accommodation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Health',
  'Travel',
  'General',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Food & Drink': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Transport': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Accommodation': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Entertainment': { bg: 'bg-pink-100', text: 'text-pink-700' },
  'Utilities': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Shopping': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Health': { bg: 'bg-red-100', text: 'text-red-700' },
  'Travel': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'General': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-700' },
}
