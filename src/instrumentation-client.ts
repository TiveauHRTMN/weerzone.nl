const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key && typeof window !== "undefined") {
  const win = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  };
  const init = () => {
    import("posthog-js").then(({ default: posthog }) => {
      if ((posthog as any).__loaded) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        defaults: "2026-01-30",
        person_profiles: "identified_only",
        capture_pageview: false,
      });
    });
  };
  if (win.requestIdleCallback) {
    win.requestIdleCallback(init, { timeout: 2500 });
  } else {
    window.setTimeout(init, 1500);
  }
}
