# Dynamic workspace audit

Priority: employees and Super Admin, followed by organizer, client, ordinary event staff and attendee.

Findings: most legacy role runtimes render independent local-storage demo arrays; several mutation handlers show success without a backend write. Administrator charts contain minimum fictional values. Notifications and account edits are not consistently synchronized. Scanner legacy tests assume copied role components rather than the actual Employee2 wrapper. Finance and support have newer real API implementations and must be retained.

Implementation: retain backend seed records, existing role routes, sidebar shell, branding and theme. Introduce one shared connected workspace renderer and role-scoped backend snapshot to replace disconnected operational screens. Reuse existing registration, payment, event request, event, assignment and support APIs for their business workflows. Add missing employee review/task/report operations with persisted audit records and backend department checks. Preserve the finance module and report inbox. Replace local login fallback and local-only account mutations. Verify role boundaries and cross-role workflows against isolated persisted seed data; report remaining unavailable integrations honestly.
