'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { SessionProvider } from '@/lib/session-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </PostHogProvider>
  )
}
