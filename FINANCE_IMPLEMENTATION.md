# Finance Executive implementation

## Repository findings and plan

EventFlow uses a React/Vite frontend and NestJS backend. The backend persists its `DataStore` arrays to a JSON file, not to the SQL schema under `Database/`. Authentication uses JWTs. The existing payment service uses `DEMO_PROVIDER`; it does not call a real gateway. Finance read endpoints already existed, while the Finance Executive UI displayed browser-local sample transactions and an invented 15% commission.

The implementation keeps the employee shell and its theme. It routes Finance Executives to `employee3`, reads financial records only from authenticated finance endpoints, adds safe report exports and profile mutations, and labels unsupported external operations. No commission, settlement, or gateway record is fabricated.

## Implemented

- Finance sidebar with expandable submenu and browser history for finance pages. Organizer Settlements and Account Settings are hidden from the Finance Executive workspace.
- Dashboard with captured payment, refund, ticket, status, trend, and event revenue data; date filters, loading, empty, and retry states. Revenue uses an area chart, payment status a donut chart, event revenue horizontal bars, and refunds grouped bars.
- Backend filtered and paginated transaction and refund tables, detail drawer, and refund review notes with actor and timestamp.
- Commission & Revenue preview with a clearly labeled illustrative five-event dataset and a 12% demo rate. This page is separate from actual backend revenue and does not represent an approved commission policy.
- Daily, monthly, event, transaction, and refund reports with relevant filters and CSV/PDF export. Exports include all matching records, capped at 10,000 rows. CSV cells that begin with formula characters are escaped.
- Report portal that saves a snapshot of every matching report row when a Finance Executive sends it to Super Admin. The sender can track submitted or reviewed status and read Super Admin feedback. Super Admin reviews these reports in Employee Reports; submissions and feedback persist in the backend JSON store.
- Account Settings and its finance-specific API routes have been removed from this workspace. Existing shared authentication and account flows remain available to other roles.
- Finance role checks use the authenticated JWT and verify that the current user is active and has the Finance Executive employee type.

## Endpoints

The finance data routes require a Finance Executive bearer token. The report submission listing also allows Super Admin, and its review route is Super Admin only.

| Route | Purpose |
| --- | --- |
| `GET /api/finance/dashboard` | Financial totals and trends |
| `GET /api/finance/overview` | Dashboard charts and recent activity |
| `GET /api/finance/transactions` | Search, filter, sort, and paginate payments |
| `GET /api/finance/transactions/:id` | Payment detail and refund history |
| `GET /api/finance/refunds` | Search, filter, and paginate refunds |
| `GET /api/finance/refunds/:id` | Refund detail |
| `POST /api/finance/refunds/:id/reviews` | Persist a review note for a pending eligible refund |
| `GET /api/finance/reconciliation` | Explicit unavailable state |
| `GET /api/finance/reports` | Filtered report data and totals |
| `GET /api/finance/reports.csv` | Full filtered CSV export |
| `GET /api/finance/reports.pdf` | Full filtered PDF export |
| `POST /api/finance/submissions` | Save and send a filtered report snapshot |
| `GET /api/finance/submissions` | List own sent reports or all reports for Super Admin |
| `PATCH /api/finance/submissions/:id/review` | Super Admin review status and feedback |

## Data and setup

The finance module adds optional `Refund.reviews`. Previously added optional `User.bio` and `User.preferences.emailNotifications` fields remain compatible with existing JSON data, though Account Settings no longer uses them. The JSON store accepts missing fields, so no destructive migration is required. No SQL tables or indexes were changed because the running backend does not use the SQL schema. Start the backend from `backend` with `npm run start:dev` and the frontend from `frontend` with `npm run dev`. The backend data path can be set with `EVENTFLOW_DATA_FILE`; otherwise it writes `backend/data/eventflow-store.json` when started from `backend`.

## Integration limits

- `DEMO_PROVIDER` simulates capture and refund. It has no independent gateway ledger, webhook verification, real payout, or reconciliation feed.
- No approved commission policy or organizer settlement contract exists. The Commission & Revenue page displays sample figures only. Organizer Settlements is removed from Finance Executive navigation. Settlement approval and payout recording were not added.
- Finance Executives can review refunds, but cannot approve or process them. The existing `POST /api/payments/refunds/:id/process` remains Super Administrator only and completes a **simulated** refund.
- Existing amounts are stored as numeric rupee values in the application data store. Converting all historical payments and ticket prices to integer minor units requires a coordinated data migration across existing payment flows.
- The app still contains legacy seeded demo records and local mock state in other workspaces. The active Finance Executive pages no longer calculate from that local mock state.
