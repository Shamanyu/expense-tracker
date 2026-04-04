@AGENTS.md

# Splitwise Clone

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **UI:** shadcn/ui (base-ui primitives, NOT radix — no `asChild`, use `render` prop)
- **Auth:** Supabase Auth (Google OAuth only)
- **Database:** Supabase JS client (no ORM)
- **State:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Currency:** dinero.js v2

## Key Architecture Decisions
- Server Components by default; `"use client"` only for interactive elements
- Mutations via Server Actions in `app/actions/` with `"use server"` directive
- TanStack Query for client-side caching + optimistic updates
- `cookies()` and `headers()` are **async** in Next.js 16 — always `await` them
- Middleware is deprecated in Next.js 16 in favor of `proxy` — current `middleware.ts` still works but shows a warning

## Project Structure
- `app/(protected)/` — all authenticated routes, wrapped by `AppShell`
- `app/actions/` — server actions (groups, expenses, settlements, friends, account)
- `components/` — organized by feature (groups, expenses, balances, settle, friends, activity, common, layout)
- `hooks/` — TanStack Query hooks for all data fetching
- `lib/supabase/` — browser and server Supabase clients
- `lib/utils/` — currency conversion, split calculation, debt simplification
- `lib/types/` — hand-written DB types and app-level derived types

## shadcn/ui Notes (base-ui, not radix)
- No `asChild` prop — use `render={<Component />}` instead
- `Select.onValueChange` receives `(value | null, eventDetails)` — guard against null
- `Tabs` uses `defaultValue` on root, `value` on `TabsTrigger` and `TabsContent`
- `Dialog`, `Popover`, `Sheet` all use base-ui primitives from `@base-ui/react`

## Environment
- `.env.local` — local dev keys (gitignored)
- `.env.example` — template checked into git
- `.env.production` — production placeholders (real values set in Vercel)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
