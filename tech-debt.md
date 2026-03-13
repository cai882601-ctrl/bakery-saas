# Tech Debt Registry — BakeBoard

| ID | Source | Severity | Description | Status | Added | Resolved |
|----|--------|----------|-------------|--------|-------|----------|
| TD-001 | T-311-ux Stage 3 | High | Dashboard doesn't distinguish loading/error from empty state — `isLoading`/`isError` ignored, shows onboarding card during network failures | open | 2026-03-13 | — |
| TD-002 | T-311-ux Stage 3 | Medium | Active Products count caps at 1 — `products.list({limit:1})` then uses `.length` instead of total count | open | 2026-03-13 | — |
| TD-003 | T-311-ux Stage 3 | Medium | `Record<string, unknown>` bypasses TypeScript — dashboard and calendar use unsafe casts, runtime failures possible on schema changes | open | 2026-03-13 | — |
| TD-004 | T-305 | Medium | Settings page is empty shell — no functional settings implemented | open | 2026-03-13 | — |
| TD-005 | T-303 | Low | `vitest` types missing — `stripe.test.ts` blocks clean `tsc --noEmit` | open | 2026-03-13 | — |
| TD-006 | Lighthouse | Low | Missing source maps for first-party JS (dev-mode only) | open | 2026-03-13 | — |
