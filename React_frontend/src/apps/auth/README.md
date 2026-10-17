# auth

Shared account and login policy used across role runtimes. The account policy stays in src/shared/utils/account-policy.js because every role loads it.

Routes: Used by all routes.

- `api/`: Backend request helpers.
- `app/`: Role entry component and runtime.
- `assets/`: Files used only by this role.
- `components/`: Reusable role UI components.
- `context/`: React context providers.
- `data/`: Static lookups or seed data.
- `hooks/`: Role-specific React hooks.
- `pages/`: Role screens.
- `styles/`: Role stylesheets.
- `utils/`: Role helper functions.
