# Tech Debt Registry — BakeBoard

| ID | Source | Severity | Description | Status | Added | Resolved |
|----|--------|----------|-------------|--------|-------|----------|
| TD-001 | T-311-ux Stage 3 | High | Dashboard loading/error state — was showing onboarding during load/error | **resolved** | 2026-03-13 | 2026-03-13 |
| TD-002 | T-311-ux Stage 3 | Medium | Active Products count — now uses `count: "exact"` from Supabase | **resolved** | 2026-03-13 | 2026-03-13 |
| TD-003 | T-311-ux Stage 3 | Medium | `Record<string, unknown>` bypasses TypeScript — dashboard and calendar use unsafe casts, runtime failures possible on schema changes | open | 2026-03-13 | — |
| TD-004 | T-305 | Medium | Settings page is empty shell — no functional settings implemented | open | 2026-03-13 | — |
| TD-005 | T-303 | Low | `vitest` types missing — `stripe.test.ts` blocks clean `tsc --noEmit` | open | 2026-03-13 | — |
| TD-006 | Lighthouse | Low | Missing source maps for first-party JS (dev-mode only) | open | 2026-03-13 | — |
| TD-007 | TD-001 Stage 3 | Medium | Orders/Customers pages lack isError handling — errors show as empty state | open | 2026-03-13 | — |
| TD-008 | TD-001 Stage 3 | Medium | Dashboard uses 3+ heavyweight list queries for stats — needs dedicated stats endpoint | open | 2026-03-13 | — |
| TD-009 | TD-001 Stage 3 | Low | Calendar tooltip says "today" for all dates — should use actual date | open | 2026-03-13 | — |
