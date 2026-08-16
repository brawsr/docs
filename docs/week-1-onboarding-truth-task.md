# Week 1 onboarding-truth task

Owner: public documentation
Source: Day 1 copy inventory and J1 on 2026-08-16

Status: **locally implemented and verified; production deployment approval required**

## Confirmed changes

1. Add one concise quickstart callout with the free-alpha limits: three total
   session units, 10-minute standard session maximum, and three runtime hours
   per month.
2. Link from the quickstart to the existing recovery-limit detail and expose a
   current founder-help/support route.
3. Preserve the accurate existing safe-point, remote-side-effect, browser
   replacement, stale-handle, and live-connection language.
4. In the MCP guide, correct the late reference to the `0.1.x` local stdio
   package so it agrees with the documented and published `0.2.0` package. Keep
   the explicit statement that MCP manages lifecycle/state operations and does
   not proxy browser actions or CDP.

## Acceptance evidence

- Quickstart readers see limits, boundaries, and help without needing the
  authenticated console.
- No page promises mid-action capture, server-side rollback, automatic
  recovery, or survival of live connections.
- MCP version and scope are internally consistent.
- Link validation, content checks, lint, and static build pass.
- After an approved production deployment, J1 is rerun against public docs.

## Local verification — 2026-08-16

- [x] Quickstart exposes the three-unit, 10-minute, and three-hour free-alpha
  limits before the runnable examples.
- [x] Quickstart links to founder help and the full recovery-limit contract.
- [x] The safe-point, remote-side-effect, browser-replacement, live-connection,
  and stale-handle boundaries are explicit.
- [x] The MCP guide now consistently names package `0.2.0` and retains the
  no-CDP-proxy boundary.
- [x] `npm test` passed: public contract validation, 9/9 contract tests,
  synchronized examples, customer-copy validation across 29 pages, route type
  generation, lint, 94-page static build, and static-output verification.
- [ ] Deploy the CI-built immutable artifact and rerun J1 in production after
  exact approval.
