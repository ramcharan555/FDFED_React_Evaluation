# EventFlow finance delivery

For the latest cross-role integration and verification results, see [WORKSPACE_CONNECTION_REPORT.md](WORKSPACE_CONNECTION_REPORT.md). Its passing scanner suite and real-browser checks supersede the earlier verification limitations recorded below.

## Report submission workflow update

Finance Executive → Reports now includes **Send Report to Super Admin**. The sender enters a title and optional notes; the backend regenerates the report from the applied filters and saves all matching records as an immutable snapshot. Client-supplied financial records are never accepted. Repeated requests with the same submission key reuse the original submission, including after a response is lost.

Super Admin → Revenue Reports now starts with **Received Finance Reports**. Administrators can filter by submission status, open the original report, download its saved CSV/PDF, and mark it reviewed with optional feedback. Finance Executive → Reports → **Sent Reports** shows the saved report, status, and administrator feedback. Refresh either list to see new submissions/reviews. Backend notifications are persisted for active Super Admin recipients on submission and for the sender on review.

The Account Settings menu item has been removed from the Finance Executive sidebar. The account settings page and existing profile access remain available.

New persisted collection: `financeReportSubmissions`. Existing snapshots initialize it empty. Submission, notification and audit writes share the existing finance persistence/rollback boundary. Reports are limited to 5,000 records / 5 MiB per saved snapshot; PDF downloads retain the 2,000-record limit. No active Super Admin, unavailable report integrations, invalid filters, or persistence failure produce a delivery success.

New endpoints under `/api/finance`:

| Method | Path | Access / purpose |
|---|---|---|
| POST | `/submitted-reports` | Finance Executive sends a backend-generated filtered report with title, notes and idempotency key |
| GET | `/submitted-reports` | Finance users list their own sent reports; Super Admin lists received reports |
| GET | `/submitted-reports/:id` | Sender or Super Admin reads the original snapshot and review |
| GET | `/submitted-reports/:id/export?format=csv\|pdf` | Sender or Super Admin downloads the saved snapshot |
| POST | `/submitted-reports/:id/review` | Super Admin marks a submitted report reviewed with optional notes |

Additional frontend files: `frontend/src/services/financeReportInbox.js`, `frontend/src/styles/financeReports.css`, `frontend/tests/finance-report-inbox.test.cjs`. Updated the admin React entry/runtime, finance React entry/UI, data store, finance service/controller, and finance tests.

Verification for this update: backend TypeScript check passed; all **15 backend finance tests** passed, including real HTTP send → administrator receive/download → review → sender feedback, ownership restrictions, duplicate prevention, immutable snapshots, persistence restoration and rollback. All **8 frontend finance/inbox tests** passed, including sender controls, receiver snapshot/download/review behavior and sidebar removal. Production frontend build passed, retaining the existing bundle-size warning. The first sandboxed build was blocked by filesystem access; rerunning outside the sandbox passed. No live application records were submitted during testing. Browser visual/end-to-end checks were not performed.

## Implemented

- Finance department dashboard with backend summaries, daily/weekly/monthly/yearly revenue and commission line charts, payment-status bars, event gross/net revenue bars, requested/completed refund trends, recent financial records and details.
- Expandable finance navigation, responsive dark styles, active states, hash history/back/forward and refresh restoration. Other departments retain their renderer.
- Payment transactions: combined server-side search, date/event/organizer/status/method filters, date/amount sorting, pagination, booking/customer context and refund history. No arbitrary status or amount editing.
- Refunds: details, review, explicitly authorized approval/rejection, required rejection reasons, policy/balance/booking validation and actor/status audit trail. Approval does not complete or transfer a refund.
- Settlements: event/date calculation, eligible payment allocation, refund deductions, integer commission rounding, policy snapshots, duplicate prevention, details and authorized approval. Missing policies and unresolved refunds block calculation. Demo/unverified settlements cannot be recorded as real paid settlements.
- Commission/revenue: event breakdown, organizer chart, gross/refund/net amounts, read-only policy versions. Administrator policy creation and permission grants are API operations; no unrelated administrator screens were changed.
- Reconciliation: explicit unavailable state; no fabricated gateway records, matches or discrepancy counts.
- Eight report types: transactions, daily revenue, monthly revenue, events, refunds, settlements, commissions and reconciliation availability. Backend filtered results, totals and charts; complete filtered CSV/PDF exports rather than visible-page exports. CSV formula protection, PDF branding/metadata/page numbers, and export row limits.
- Finance account settings: persisted profile/bio/preferences, current-password verification and scrypt-hashed new passwords. Existing login accepts these hashes while preserving legacy account compatibility. Email changes require reauthentication. Existing support and sign-out links remain available.

## Source files

Modified:

- `backend/src/app.module.ts`
- `backend/src/common/data-store.ts`
- `backend/src/common/interceptors/data-store-persistence.interceptor.ts`
- `backend/src/modules/auth/auth.service.ts`
- `frontend/src/apps/employee3/Employee3.jsx`
- `frontend/src/apps/employee3/runtime.js`

Added:

- `backend/src/modules/finance/finance.module.ts`
- `backend/src/modules/finance/finance.controller.ts`
- `backend/src/modules/finance/finance.service.ts`
- `backend/src/modules/finance/finance.exports.ts`
- `backend/src/common/utils/password.ts`
- `backend/tests/finance.test.cjs`
- `frontend/src/apps/employee3/finance.js`
- `frontend/src/apps/employee3/finance.css`
- `frontend/tests/finance.test.cjs`
- `FINANCE_IMPLEMENTATION.md`, `FINANCE_DELIVERY.md`

## Persistence and financial semantics

The active backend does not use the supplied SQL schema. It uses DataStore with atomic JSON snapshots. Four collections are added: `financeSettlements`, `commissionPolicies`, `financeAudit`, and `financeGrants`. User bio/preferences and refund review statuses are additive. Old snapshots initialize missing collections empty. No records are deleted and no SQL migration/index commands are needed.

Finance responses and new financial records use integer INR paise. Existing rupee payment/refund amounts are validated and converted at the boundary. Commission uses integer basis points and BigInt rounding, half up. 100 basis points = 1%. There is no invented default rate. Multiple successful attempts for a booking are deduplicated in revenue and settlement eligibility; individual attempts remain visible in transactions.

Dashboard gross/trends use captured-equivalent (`completed` or subsequently `refunded`) internal records by payment date. Completed refund cash flow uses processing date (request date only for legacy records missing processing date). Net dashboard revenue is period cash flow. Event revenue is a payment-date cohort with its completed refunds across history. Those definitions can differ when a refund occurs in a later reporting period. Unconfigured commission is unavailable, not silently zero. Finalized settlement lines retain their original rate/policy version.

Mutations execute synchronously in the existing single process, persist before responding, and restore touched collections when persistence fails. Repeated approvals/allocations are rejected by persisted state checks. This is not a distributed database transaction system; multiple backend processes sharing one JSON file are unsupported.

## API

All endpoints below are under `/api/finance` and require the existing JWT bearer token:

| Method | Path | Purpose |
|---|---|---|
| GET | `/config` | Available integration capabilities, filters, policies and effective permissions |
| GET | `/dashboard` | Filtered metrics, charts, event revenue and recent activity |
| GET | `/transactions`, `/transactions/:id` | Paginated payment attempts and details |
| GET | `/refunds`, `/refunds/:id` | Paginated refunds and details/history |
| POST | `/refunds/:id/review` | `action`: `review`, `approve`, or `reject`; rejection needs `reason` |
| GET | `/settlements`, `/settlements/:id` | Settlement list and frozen allocation details |
| POST | `/settlements` | Calculate with `eventId`, `from`, `to` |
| POST | `/settlements/:id/action` | `approve`; `record_external` is blocked for all current demo/unverified sources |
| GET | `/revenue` | Event financial breakdown |
| GET/POST | `/commission-policies` | Read policies / administrator creates a version |
| POST | `/permissions` | Administrator grants/revokes explicit finance permissions |
| GET | `/reconciliation` | Integration availability and explanation |
| GET | `/reports` | Paginated report records, filtered totals and chart |
| GET | `/reports/export` | All filtered records with `format=csv` or `format=pdf` |
| GET/POST | `/account` | Read/update authenticated finance user's account |
| POST | `/account/password` | Change password with `currentPassword` and `newPassword` |

List filters: `from`, `to` (`YYYY-MM-DD`, India day boundaries), `eventId`, `organizerId`, `status`, `method`, `search`, `sort` (`date_desc`, `date_asc`, `amount_desc`, `amount_asc`), `page` and `pageSize` (1–100). Chart interval: `daily`, `weekly`, `monthly`, `yearly`. Report `type`: `transactions`, `daily`, `monthly`, `events`, `refunds`, `settlements`, `commission`, `reconciliation`.

## Permissions and configuration

The persisted active user must be a super administrator or `event_staff` with `FINANCE_EXECUTIVE` or legacy `SUPPORT_FINANCE` department. Attendees, organizers, ordinary staff and other departments cannot access these organization-wide finance APIs. Identity and permissions are never read from client role headers.

Finance staff may view, export, review requests, and calculate settlements. Refund approval/rejection requires `refund.approve`; settlement approval requires `settlement.approve`. Only administrators can configure commission, grant permissions or record an external payout. No grants are seeded.

An administrator can configure policy via authenticated POST `/api/finance/commission-policies`:

```json
{"basisPoints": 0, "effectiveDate": "2026-01-01"}
```

The zero value is an example of an explicitly configured no-commission policy, not an automatic default. Supply the actual contractual basis points and effective date. Optional `eventId` creates an override. Policy versions are append-only; duplicate scope/date versions are rejected.

An administrator grants approval via authenticated POST `/api/finance/permissions`:

```json
{"userId": "<persisted finance user ID>", "permission": "refund.approve", "enabled": true}
```

No new dependencies or environment variables are required. Existing `EVENTFLOW_DATA_FILE` selects the persisted JSON file. Start the backend with `npm run start:dev` in `backend` and the frontend with `npm run dev` in `frontend`. Use an actual backend login; a legacy offline UI session cannot access finance APIs. The existing frontend API address remains `http://localhost:3001/api`.

## Verification

Executed:

- Backend `node_modules/.bin/tsc --noEmit`: passed.
- Backend `node --require ts-node/register --test tests/finance.test.cjs`: 12 passed. Includes revenue/deduplication, filters/pagination/date validation, permissions, refund state/balance/policy checks, settlement rounding/frozen policies/duplicate prevention, refund-date cash flow, exports, persistence rollback and snapshot restoration, account hashing, and real HTTP JWT authorization/validation using an isolated Nest server.
- Frontend `node --test tests/finance.test.cjs`: 4 passed. Covers backend-driven chart/metric rendering, error/retry state, request dates/authentication, finance navigation, combined runtime syntax and bypass of the legacy future-event date restriction for historical financial filters.
- Frontend `npm test`: 8 passed, 1 existing scanner assertion failed in the full-suite run before the fourth finance test was added. `ticket-scanner.test.cjs:200` expects `Employee2.jsx` to contain `LegacyRuntime source={source}`; that pre-existing component wraps Employee3. This file was not modified. The final finance-only run passed all four tests.
- Frontend `npm run build`: passed, with the existing large-bundle warning.

No browser-driven end-to-end tests or visual/responsive browser checks were performed. No real payments/refunds/payouts were initiated. Tests use isolated fixtures and a temporary snapshot, never production records.

## Remaining integration and production limits

The repository's demo payment provider and pre-existing seeded financial records are explicitly labeled simulated/unverified. This work does not convert them into trusted captured funds. Live gateway capture verification, signed webhooks, gateway refund submission/status confirmation, payout integration, gateway reconciliation, partial-refund initiation, and post-settlement refund adjustment policies remain unimplemented because the project supplies no such integrations or contractual policies. Reconciliation investigations and independent matching cannot function until a trusted source exists. Existing finalized allocations block new refund approval until an adjustment policy is implemented.

There is no external payout button for current records because every source is demo/unverified. `record_external` validates authorization/reference uniqueness for a future verified source, but current calculations intentionally cannot reach paid status.

JSON persistence and in-process synchronous guards are suitable only for the existing single-server architecture. Durable relational transactions, database uniqueness/indexes, scalable aggregation and distributed locking require a future database integration. The broader pre-existing authentication system still permits lenient matching of legacy plaintext passwords; newly changed passwords use exact scrypt verification. This module is not a claim that the entire application is production hardened.

Preference flags are persisted; integrating them into every existing email/SMS producer is outside this change. No SMS delivery provider is added. PDFs are text reports with ASCII fallback for unsupported glyphs, rather than a Unicode font-embedded layout. PDF exports cap at 2,000 records and CSV at 20,000; narrow filters for larger datasets. Transaction receipts and live gateway refresh are not offered without a trusted receipt/status source.

No commit, push or deployment was performed. Pre-existing generated backend artifacts and unrelated working-tree changes were preserved.
