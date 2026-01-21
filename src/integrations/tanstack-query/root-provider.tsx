import { QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { TRPCRouter } from '@/integrations/trpc/router'

import { TRPCProvider } from '@/integrations/trpc/react'

function getUrl() {
  // On client-side, use relative URL (works for all environments)
  if (typeof window !== 'undefined') {
    return '/api/trpc'
  }
  
  // On server-side (Cloudflare Workers), we can't make HTTP requests to ourselves
  // tRPC will work via direct procedure calls, not HTTP
  // Return a placeholder that won't be used for server-side direct calls
  return '/api/trpc'
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
})

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  })

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  return {
    queryClient,
    trpc: serverHelpers,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
