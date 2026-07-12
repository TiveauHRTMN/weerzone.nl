# Analytics

TripFit owns a small internal analytics contract. Product code emits typed events once; adapters may later forward them to a warehouse or analytics vendor.

## Event catalog

```text
landing_viewed
trip_form_started
trip_preview_viewed
account_created
trip_saved
trip_reopened
recommendation_impression
recommendation_opened
recommendation_saved
recommendation_dismissed
affiliate_clicked
trip_pass_viewed
trip_pass_started
trip_pass_purchased
activity_completed
activity_rated
```

The Prisma enum uses uppercase database values; the application event contract uses the lowercase names above.

## Event envelope

Each event contains an event ID, name, UTC occurrence time, schema version and either a privacy-safe anonymous session ID or authenticated user ID. A trip ID is optional and must be authorized before server-side use.

Properties are event-specific and allowlisted. Do not attach full trip objects, e-mail addresses, exact accommodation labels, child ages, raw URLs containing personal query parameters or provider payloads.

## Recommendation exposure

An impression is emitted only when a recommendation enters the visible product surface, not merely when ranking runs. It references the persisted recommendation snapshot and placement/rank. Open, save, dismiss, book and completion outcomes append separately.

Dismiss, skip and cancellation reasons use controlled reason codes with an optional short user note. They are part of the future recommendation dataset and require the same privacy controls as the trip.

## Affiliate clicks

Outbound links pass through a server endpoint that validates the offer, records `affiliate_clicked`, then redirects to the allowlisted destination. The event includes offer/provider/activity IDs and sponsored status, never a commission-derived ranking value.

## Reliability

Core product actions must not fail because an optional forwarding provider is down. Events are first recorded internally; forwarding is asynchronous and idempotent by event ID. Provider failures are observable and retried with a bounded policy.

## Funnel definitions

- preview conversion: `trip_preview_viewed / trip_form_started`;
- account conversion: `account_created / trip_preview_viewed`;
- save conversion: `trip_saved / trip_preview_viewed`;
- recommendation engagement: unique opened or saved recommendations / visible impressions;
- Trip Pass conversion: `trip_pass_purchased / trip_pass_viewed`;
- affiliate CTR: `affiliate_clicked / eligible offer impressions`.

Quality metrics are always segmented from commercial metrics so revenue cannot silently become a relevance proxy.
