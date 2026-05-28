
/**
 * Centraal analytics punt.
 * Gebruikt PostHog voor gedrag (views/clicks).
 */
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture(name, properties)
    })
  }
}

/**
 * Handige events
 */
export const analytics = {
  viewLocation: (placeName: string, province: string) => {
    trackEvent('view_location', { place: placeName, province })
  },
  affiliateClick: (productId: string, title: string, persona?: string) => {
    trackEvent('affiliate_click', { product_id: productId, title, persona })
  },
  subscribeClick: (fromLabel: string) => {
    trackEvent('subscribe_cta_click', { from: fromLabel })
  }
}
