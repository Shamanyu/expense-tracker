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
  { label: '🍔 Food', value: 'Food' },
  { label: '🏠 Stay', value: 'Stay' },
  { label: '🚗 Travel', value: 'Travel' },
  { label: '🛒 Shopping', value: 'Shopping' },
  { label: '📦 Other', value: 'Other' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']

export const CATEGORY_EMOJI: Record<string, string> = {
  'Food': '🍔',
  'Stay': '🏠',
  'Travel': '🚗',
  'Shopping': '🛒',
  'Other': '📦',
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Food': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Stay': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Travel': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Shopping': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-700' },
}
