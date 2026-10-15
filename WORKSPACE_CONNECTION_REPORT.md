# Connected workspace verification

Demo records are retained. Operational workspaces now read the backend's persisted records rather than independent browser demo arrays. Marketing text remains static; workspace records, counts, charts, searches, forms and status changes use backend data. No live money movements or production-record test submissions were performed.

## Employees and Super Admin

- Registration Executive: live registrations and attendee accounts, account edits/status management, registration review/flagging, event-scoped ticket check-in, reports to Super Admin, notifications and account settings. Reviewing a registration cannot mark an unpaid ticket paid or issue a ticket.
- Event Operations: live events, editing and allowed status transitions, persisted operation tasks and assignees, reports to Super Admin, notifications and account settings. Event cancellation reuses existing attendee notifications/refund creation.
- Finance Executive: existing API-backed finance pages and graphs remain connected. Filtered report snapshots reach Super Admin and review feedback returns to the sender. Account Settings remains absent from the finance sidebar. Finance notifications now use the real notification records.
- Support Executive: live support ticket queue, requester-visible replies/status changes, employee reports and notifications.
- Super Admin: live dashboard/user and employee directory, account creation and departments, attendee/user edits and suspension, events, staff invitations, operation tasks, employee report review, finance report inbox, commission policy versions, explicit finance approval grants, support tickets, notifications and account settings. Hardcoded administrator revenue minimums no longer drive the active pages.

Employee report submission is idempotent and persists report content, sender, department, status and review feedback. Super Admin and sender notifications are saved on the backend. Finance reports retain their separate immutable financial snapshot workflow.

## Other actors

- Organizer: own events, registration data, staff directory/invitations, client requests, proposals, agreement/booking confirmation, event plans and client-facing reports.
- Client: real organizer directory, event requests, requested-information responses, proposal acceptance/revision/withdrawal, agreement signing, own plans/events/reports.
- Ordinary event staff: real invitations and acceptance/decline, availability, accepted-event attendee verification, event reports and notifications. Added the missing `/staff` route, which previously redirected this actor back to the landing page.
- Attendee: live published-event catalog, registration, explicitly simulated payments, ticket verification QR, cancellation/refund request, waitlist offers/claiming, event reviews, notifications and account settings.
- Public account creation now creates a persisted user and the correct role profile. Public signup cannot create a Super Admin or department employee. Login uses the backend; failed authentication/network calls cannot silently create a browser-only session.

## Important corrections

- A one-time `workspaceDataVersion: 1` migration corrects the original Marcus/Elena Event Operations and Arjun Registration Verification demo accounts when their persisted department still has the original Support Executive value. Other records, credentials, statuses and user customizations remain intact. Later administrator department changes are preserved. New seed definitions use the correct departments.
- Every role receives a scoped workspace snapshot. Attendees cannot see other attendees' bookings; staff do not receive attendee records before accepting the event assignment; non-finance employees do not receive organization-wide payments. Passwords are removed from workspace and staff responses.
- Plans, reports, reviews and assignment mutations now verify the persisted actor and related event/profile ownership. Invalid assignment transitions and replayed reviews are rejected.
- Event and availability update requests use the actual existing `PUT` routes. Department-authorized event updates use explicit workspace endpoints.
- New bookings snapshot their ticket price. Changing an event's price cannot change an existing reservation's amount due. Payment timestamps are assigned by the backend. Waitlist confirmation snapshots the applicable ticket price when the seat is reserved.
- Finalized or cancelled event states cannot be arbitrarily reopened. Events/accounts with linked history are protected from destructive deletion; cancellation/suspension preserve history.
- New passwords use scrypt hashes. Seed credentials remain usable with exact matching. Password/profile edits persist for every role; email changes require signing in again.
- Browser back/forward and initial hash restoration work across the connected workspaces. Successful mutations notify other open tabs to refetch; no polling loop is added. Stale workspace/support responses are prevented from overwriting newly selected pages.
- The existing tested QR scanner is reused; scanned values notify native form validation before submission. Historical financial dates bypass the legacy future-event date restriction.
- Corrected the scanner test's outdated assumption that Employee2 contains a copied runtime; it now recognizes the actual Employee3 wrapper.

## Main new source

- `frontend/src/services/connectedWorkspace.js`: shared connected screens, API forms, navigation, account/signup/login integration and public catalog.
- `frontend/src/styles/connectedWorkspace.css`: existing dark-theme-compatible tables, cards, charts and dialogs.
- `frontend/src/components/LegacyRuntime.jsx`: installs the shared connected layer after each existing role runtime and preserves the scanner/support/finance helpers.
- `frontend/src/app/routes.jsx`: restores ordinary staff routing.
- `backend/src/modules/workspace/{workspace.module,workspace.controller,workspace.service}.ts`: role-scoped snapshots, department operations, tasks, reports and account mutations with persistence rollback.
- `backend/src/modules/auth/dto/register.dto.ts`: constrained public signup.
- Existing auth, users, events, registrations, payments, attendance, staff, assignments, reports, plans, requests and reviews services/controllers were corrected and reused.
- `backend/tests/workspace-flows.test.cjs`, `workspace-migration.test.cjs`, `browser-workspaces.cjs`: isolated integration, migration and real-browser QA.

## New API and persistence

Existing business APIs remain the mutation source for events, registrations, demo payments, invitations, client requests, plans, reviews, support and notifications.

Additional endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Public attendee/client/organizer/ordinary-staff account creation |
| GET | `/api/workspace` | Current authenticated actor's scoped records, metrics and permissions |
| PATCH | `/api/workspace/account` | Own profile and preferences |
| POST | `/api/workspace/password` | Own verified password change |
| PATCH | `/api/workspace/users/:id` | Authorized account edit / administrator department configuration |
| PATCH | `/api/workspace/users/:id/status` | Authorized suspension/reactivation |
| PATCH | `/api/workspace/registrations/:id/review` | Registration department review/flag |
| PUT | `/api/workspace/events/:id` | Authorized Event Operations edit |
| PATCH | `/api/workspace/events/:id/status` | Authorized event lifecycle change |
| POST/PATCH | `/api/workspace/tasks[/<id>]` | Persist operation tasks |
| POST | `/api/workspace/reports` | Employee sends report to Super Admin |
| POST | `/api/workspace/reports/:id/review` | Super Admin review with employee feedback |

`employeeReports` and `operationTasks` are additive JSON collections. Registration review metadata and optional `ticketPriceAtBooking` are additive fields. Existing snapshots initialize missing collections empty. Workspace mutations persist within a rollback boundary; the global interceptor skips duplicate writes for those endpoints.

## Checks and reproduction

Final results:

- Backend type checking: passed.
- Backend automated suite: **29 tests passed**.
- Frontend automated suite: **14 tests passed**, including the formerly failing scanner entry-point check.
- Production frontend build: passed; existing bundle-size warnings remain.
- Headless Edge: **67 role-page navigation checks across nine workspaces passed**, including all employee departments and the other actors. Real rendered employee/finance report submission and administrator review, public catalog/signup, historical commission policy creation, event creation, browser history, customer support and rapid-navigation response ordering also passed. No browser runtime exceptions were recorded in that run.
- Connected runtime syntax across all role sources and source whitespace checks: passed.

Browser testing exposed and resolved a stale-form-response race: navigating immediately after submitting a form could let the completed mutation render the newly selected support route as a generic page. Mutations now refresh only the page/version that submitted them; support requests have their own response guards.

Run from `backend`:

```powershell
npm run typecheck
npm test
npm run test:browser
```

Run from `frontend`:

```powershell
npm test
npm run build
```

Backend checks cover authentication and role boundaries; employee/admin task and report round trips; registration review and QR check-in; reservation price invariance; demo payment/refund approval; staff invitation acceptance; waitlists; client proposal/agreement/booking flow; plans and reports delivered to their owner; support replies; notification read state; profile/password persistence; immutable finance report snapshots; and the one-time migration.

Browser QA uses installed headless Edge, a fresh temporary browser profile, and a temporary backend seeded with demo records. It visits the real built role pages and submits actual employee/finance report, review, signup, policy and event forms. API calls are redirected inside the test browser to the isolated test backend. SMTP is disabled for these tests; no real payments, payouts, or emails are sent. `EVENTFLOW_EDGE_PATH` can override the installed Edge executable path. Test files and profiles are cleaned up after the run.

## Applying and limits

Restart the backend and refresh the frontend so the new routes/modules and automatic migration load. Use `npm run start:dev` in `backend` and `npm run dev` in `frontend` for source development. No dependency installation or destructive database migration is required. Back up the existing JSON file as part of normal operations; `EVENTFLOW_DATA_FILE` still selects it.

The existing JSON store remains a single-process persistence layer. Non-financial workspace lists load an authorized snapshot and paginate in the browser; finance lists retain backend pagination. Large datasets and multiple backend writers require database-backed pagination/transactions. Browser tab updates are signaled within the same browser; another device receives changes on refresh/navigation. Real capture/refund/payout/reconciliation integrations remain unavailable and are explicitly labeled. Deposit status in client requests is demo bookkeeping, not evidence of a bank transfer. SMS/email delivery still requires the project's existing provider configuration. Physical camera hardware and every conceivable timeout/concurrency condition were not exhaustively tested. Existing large legacy runtime bundle warnings remain; the copied legacy sources are retained for compatibility while the shared layer owns the active connected workflows.
