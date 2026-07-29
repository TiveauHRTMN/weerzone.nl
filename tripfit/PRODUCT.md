# TripFit product

## Positioning

TripFit is **Caribbean Live Travel Intelligence**. It turns one concrete trip into a living environment that changes with time, route, weather, season, company and prior choices.

> Niet wat er te doen is. Wat voor jouw reis nú het beste is.

TripFit is not a booking site, generic itinerary builder, chat interface or broad travel-content portal. The primary job is reducing search and decision fatigue at the moment a traveler needs to choose.

## First market

The first country pack covers the complete Dominican Republic. Content depth is deliberately asymmetric:

- flagship: Punta Cana / Bávaro, Santo Domingo, Samaná / Las Terrenas;
- standard: Puerto Plata / Cabarete, La Romana / Bayahíbe, Santiago, Jarabacoa / Constanza;
- basic: Barahona / Bahoruco, Pedernales and relevant connecting destinations.

The product model remains country-agnostic so the next Caribbean pack can reuse the same onboarding, trip lifecycle, provider contracts and ranking engine.

## Core journey

1. A traveler lands on a public destination page.
2. They provide exact dates and company details progressively.
3. TripFit immediately opens a personalized, anonymous preview.
4. Registration saves the preview as a private living trip.
5. The dashboard changes with the phase of the trip.
6. During the trip, Today presents one best choice, two alternatives and what to postpone.
7. Trip Pass can activate live features for this trip; it is never framed as a subscription.
8. Relevant external bookings may use transparent affiliate links without influencing organic order.

## Trip phases

| Phase | Primary traveler question | Product response |
| --- | --- | --- |
| `PLANNING_LONG_RANGE` | What is structurally relevant for this period and route? | Climate, seasons, regional trade-offs and early reservations; no false daily forecast. |
| `PLANNING_SUBSEASONAL` | What is becoming likely? | Weather regime, events, reservation windows and provisional day clusters. |
| `PLANNING_FORECAST` | Which day fits which choice? | Daily weather fit, Plan A/B and change signals. |
| `IN_TRIP` | What is best today? | One best choice, two alternatives, deferrals, travel time and changes since yesterday. |
| `COMPLETED` | What do I keep and what comes next? | Archive, completed activities, favorites, feedback and next-trip entry point. |

## Product principles

- Explain every recommendation using observable factors.
- Never show precision the underlying source cannot support.
- Ask only for information that improves the trip.
- Keep technology invisible; the interface is a travel product, not an AI demo.
- Treat family age, accessibility and travel time as decision inputs, not secondary filters.
- Separate official warnings from local opportunity signals.
- Keep organic relevance independent from affiliate economics.
- Show source, verification time, confidence and fallback state for current information.
- Never sell individual trip profiles or personal traveler data.

## Slice 1 outcome

The first vertical slice proves the acquisition loop: a user can configure an exact multi-region Dominican Republic trip and receive a valuable route-aware preview without creating an account or configuring an external API. The preview exposes why information is relevant and leads naturally to saving the private trip in Slice 2.

## Success measures

The initial funnel is measured through:

- landing-to-form-start rate;
- form completion and preview-open rate;
- preview-to-account conversion (Slice 2);
- return visits to a saved trip;
- recommendation open, save and completion rates;
- Trip Pass view and purchase rates;
- affiliate click-through rate, reported separately from recommendation quality;
- recommendation dismiss/cancel reasons and rating.

Every shipped feature must increase usage, return behavior, conversion, revenue per trip or trust.
