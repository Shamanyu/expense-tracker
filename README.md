# Settl

A full-featured expense splitting app built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Google OAuth** login via Supabase Auth
- **Groups** — create groups, invite members by email, manage roles
- **Expenses** — add expenses with 4 split types: equal, exact, percentage, shares
- **Balance computation** — net balances per user with greedy debt simplification
- **Settle up** — suggested payments + custom payment recording
- **Friends** — auto-derived from shared groups + friend requests
- **Activity feed** — real-time log of expenses and settlements across all groups
- **Multi-currency** — 50+ currencies with static FX conversion rates
- **Mobile-first** — bottom nav on mobile, sidebar on desktop

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres + JS client) |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |
| Notifications | sonner |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client

### 1. Clone and install

```bash
git clone <repo-url>
cd settl
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database schema in **SQL Editor** (see `schema.sql` section below)
3. Enable **Google OAuth** under Authentication → Providers → Google
4. Under Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (or your production domain)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web Application)
3. Authorized JavaScript Origins: `http://localhost:3000`
4. Authorized Redirect URIs: `https://<your-project>.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret into Supabase Google provider settings

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase **Project URL** and **anon public key** (found in Settings → API).

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
4. Update Supabase redirect URLs and Google OAuth origins with your Vercel domain

## Database Schema

Run this in your Supabase SQL Editor to set up all tables, RLS policies, triggers, and indexes:

<details>
<summary>Click to expand SQL schema</summary>

```sql
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  default_currency text not null default 'INR',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Anyone can view profiles" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GROUPS
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  default_currency text not null default 'INR',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  archived_at timestamptz
);
alter table public.groups enable row level security;
create policy "Members view group" on public.groups for select
  using (exists (
    select 1 from public.group_members
    where group_id = groups.id and user_id = auth.uid()
  ));
create policy "Auth users create groups" on public.groups for insert
  with check (auth.uid() is not null);
create policy "Creator updates group" on public.groups for update
  using (created_by = auth.uid());

-- GROUP MEMBERS
create table public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);
alter table public.group_members enable row level security;
create policy "Auth users join groups" on public.group_members for insert
  with check (auth.uid() is not null);
create policy "Members view members" on public.group_members for select
  using (exists (
    select 1 from public.group_members gm2
    where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
  ));
create policy "Admins delete members" on public.group_members for delete
  using (exists (
    select 1 from public.group_members gm2
    where gm2.group_id = group_members.group_id
      and gm2.user_id = auth.uid()
      and gm2.role = 'admin'
  ));
create policy "Users update own membership" on public.group_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- EXPENSES
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  paid_by uuid references public.profiles(id),
  split_type text not null default 'equal',
  category text not null default 'general',
  date date not null default current_date,
  notes text,
  receipt_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
alter table public.expenses enable row level security;
create policy "Members view expenses" on public.expenses for select
  using (exists (
    select 1 from public.group_members
    where group_id = expenses.group_id and user_id = auth.uid()
  ));
create policy "Members add expenses" on public.expenses for insert
  with check (exists (
    select 1 from public.group_members
    where group_id = expenses.group_id and user_id = auth.uid()
  ));
create policy "Creator updates expense" on public.expenses for update
  using (created_by = auth.uid());

-- EXPENSE SPLITS
create table public.expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references public.expenses(id) on delete cascade,
  user_id uuid references public.profiles(id),
  amount numeric(12,2) not null,
  unique(expense_id, user_id)
);
alter table public.expense_splits enable row level security;
create policy "Members view splits" on public.expense_splits for select
  using (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_splits.expense_id and gm.user_id = auth.uid()
  ));
create policy "Members insert splits" on public.expense_splits for insert
  with check (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_splits.expense_id and gm.user_id = auth.uid()
  ));
create policy "Members update splits" on public.expense_splits for update
  using (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_splits.expense_id and gm.user_id = auth.uid()
  ));

-- SETTLEMENTS
create table public.settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  payer_id uuid references public.profiles(id),
  payee_id uuid references public.profiles(id),
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  notes text,
  settled_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);
alter table public.settlements enable row level security;
create policy "Members view settlements" on public.settlements for select
  using (exists (
    select 1 from public.group_members
    where group_id = settlements.group_id and user_id = auth.uid()
  ));
create policy "Members record settlements" on public.settlements for insert
  with check (exists (
    select 1 from public.group_members
    where group_id = settlements.group_id and user_id = auth.uid()
  ));

-- FRIENDSHIPS
create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references public.profiles(id),
  addressee_id uuid references public.profiles(id),
  status text not null default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);
alter table public.friendships enable row level security;
create policy "Users view own friendships" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users manage own friendships" on public.friendships for all
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- PERFORMANCE INDEXES
create index on public.expenses(group_id) where deleted_at is null;
create index on public.expense_splits(expense_id);
create index on public.expense_splits(user_id);
create index on public.settlements(group_id);
create index on public.group_members(user_id);
create index on public.group_members(group_id);
```

</details>

## Project Structure

```
app/
  (protected)/          # Authenticated routes
    dashboard/          # Summary + balances + activity
    groups/             # Group CRUD + detail
    friends/            # Friend list + requests
    activity/           # Activity feed
    account/            # Profile settings
    settle/[groupId]/   # Settle up page
  auth/callback/        # OAuth callback handler
  actions/              # Server actions
components/
  layout/               # AppShell, Sidebar, BottomNav, TopBar
  groups/               # GroupCard, GroupForm, MemberList
  expenses/             # ExpenseForm, ExpenseList, SplitInput
  balances/             # BalanceSummary, BalanceRow
  settle/               # SettleUpList, SettleForm
  friends/              # FriendCard, FriendSearch
  activity/             # ActivityFeed, ActivityItem
  common/               # CurrencySelect, UserAvatar, EmptyState, LoadingSkeleton
hooks/                  # TanStack Query hooks
lib/
  supabase/             # Browser + server clients
  utils/                # Currency, split calculation, balance computation
  types/                # TypeScript types
```

## License

MIT
