# Finance implementation plan

The existing application uses React/Vite, a legacy employee renderer, NestJS JWT authentication, and DataStore collections persisted atomically to JSON. The SQL diagram is not the active persistence layer. Payments are explicitly simulated by DEMO_PROVIDER; there is no trusted gateway or payout API.

1. Extend existing persisted collections additively for settlements, commission policies, finance permissions and audit history. Reuse payments, refunds, registrations, events and users.
2. Add a JWT-protected finance module that checks the persisted employee department. Use integer paise, validated filters and backend pagination/aggregation. Keep unknown commission amounts unavailable.
3. Add refund review/approval/rejection without claiming gateway completion. Add settlement calculation, approval, and administrator-only recording of external payout references. Freeze policy and payment allocations.
4. Connect finance department navigation to API-driven dashboard, transactions, refunds, settlements, revenue, reconciliation availability and reports. Render accessible SVG charts from backend aggregates and export filtered data.
5. Preserve existing settings/support/notifications/sign-out. Verify TypeScript, frontend build, backend financial calculations and permissions using isolated fixtures. Document unsupported external integrations and verification limits.

No deployment, commits, seed records, or live money movements are part of this change.
