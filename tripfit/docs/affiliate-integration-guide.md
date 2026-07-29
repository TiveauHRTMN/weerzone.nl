# Affiliate integration guide

Affiliate links are disabled unless `CALOR_AFFILIATES_ENABLED=true`. Organic
ranking never receives commission data.

Each provider implements `AffiliateProviderAdapter` in
`src/features/affiliates/adapter.ts`. Normalize provider products into verified
`TravelOption` values, build an HTTPS tracking URL and persist the click before
redirecting. Configure an exact hostname allowlist per provider; redirects to
unknown hosts fail closed.

Outbound UI must use `rel="sponsored noopener noreferrer"`, identify the link as
an external booking option and avoid claims about live price or availability
unless the provider response supplies a recent verified value.

When affiliates are disabled, `resolveAffiliateClick` returns a neutral Calor
detail path and performs no commercial redirect. Phase one never checks out an
external excursion inside Calor; the external provider remains the contract
party.

Before activation:

1. sign provider agreements and record allowed domains;
2. add credentials only to Vercel server environment variables;
3. implement and contract-test the provider adapter;
4. verify disclosure, consent and click retention;
5. test disabled and enabled paths on staging;
6. activate one provider at a time.

