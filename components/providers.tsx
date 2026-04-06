'use client'

import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { createGroup } from '@/app/actions/groups'
import { createExpense } from '@/app/actions/expenses'
import { callServerAction } from '@/lib/utils/serverAction'

const persister =
  typeof window !== 'undefined'
    ? createSyncStoragePersister({ storage: window.localStorage })
    : undefined

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cache for offline use
          refetchOnWindowFocus: false,
        },
        mutations: {
          networkMode: 'offlineFirst',
        },
      },
    })

    // Register mutation defaults so rehydrated mutations know how to replay
    client.setMutationDefaults(['createGroup'], {
      mutationFn: async (data: Parameters<typeof createGroup>[0]) => {
        const result = await callServerAction(() => createGroup(data))
        if (result.error) throw new Error(result.error)
        return result.data
      },
    })

    client.setMutationDefaults(['createExpense'], {
      mutationFn: async (data: Parameters<typeof createExpense>[0]) => {
        const result = await callServerAction(() => createExpense(data))
        if (result.error) throw new Error(result.error)
        return result.data
      },
    })

    return client
  })

  if (!persister) {
    // SSR: no persistence
    return (
      <>{children}</>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      onSuccess={() => {
        // Resume any mutations that were paused while offline
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries()
        })
      }}
    >
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}
