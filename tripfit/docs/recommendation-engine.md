# Recommendation engine

`rankTravelOptions` is deterministic and commission-blind.

The hard gates run first: publication/verification, destination, date window,
weekday, minimum age, thunderstorm safety and wind limit. Rejected items retain
plain-language reasons.

Eligible options are scored on weather, traveler profile, date, distance,
budget, quality and local value. Stable IDs break exact ties. Repeated option
types receive a transparent diversity adjustment. Affiliate eligibility and
commission are not inputs.

`generateDailyTravelPlan` selects morning, afternoon and evening moments and
keeps suitable unselected indoor/mixed options as Plan B. AI may only rewrite
the supplied factual signals through a strict Zod schema. Invalid or unavailable
AI output falls back to deterministic copy.

Future changes must version weights and persist the input/score snapshot so a
past recommendation remains explainable.

