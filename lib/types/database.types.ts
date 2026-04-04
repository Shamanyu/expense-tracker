export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  default_currency: string
  created_at: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  default_currency: string
  created_by: string | null
  created_at: string
  archived_at: string | null
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export type Expense = {
  id: string
  group_id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  split_type: 'equal' | 'exact' | 'percentage' | 'shares'
  category: string
  date: string
  notes: string | null
  receipt_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ExpenseSplit = {
  id: string
  expense_id: string
  user_id: string
  amount: number
}

export type Settlement = {
  id: string
  group_id: string
  payer_id: string
  payee_id: string
  amount: number
  currency: string
  notes: string | null
  settled_at: string
  created_by: string
}

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export type Invitation = {
  id: string
  inviter_id: string
  email: string
  type: 'friend' | 'group'
  group_id: string | null
  status: 'pending' | 'accepted'
  created_at: string
}
