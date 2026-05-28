
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return;
    let cancelled = false;
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const capture = () => {
      import('posthog-js').then(({ default: posthog }) => {
        if (cancelled) return;
        let url = window.origin + pathname
        if (searchParams?.toString()) {
          url = url + `?${searchParams.toString()}`
        }
        posthog.capture('$pageview', {
          $current_url: url,
        })
      });
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(capture, { timeout: 2500 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(capture, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [pathname, searchParams])

  return null
}
