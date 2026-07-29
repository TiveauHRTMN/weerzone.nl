# Weerzone referral integration

The referral is prepared but disabled by
`CALOR_WEERZONE_REFERRAL_ENABLED=false`.

`buildWeerzoneReferral` creates a small content payload and a Calor landing URL
with `utm_source=weerzone`, `utm_medium=referral`, campaign and variant. Calor's
attribution layer preserves first touch and updates last touch.

The eventual Weerzone embed must render without the Calor application bundle,
reserve its dimensions to prevent layout shift, support keyboard and screen
reader use, and expose campaign/variant identifiers. Rollout starts with a
limited page cohort. Location, forecast horizon, wet/cold periods, school
holidays and seasonal campaigns are segmentation inputs, not separate
uncontrolled link pages.

