# EventFlow Frontend

EventFlow is the existing single-page Event Registration & Attendee Management application.

## Frontend structure

- `users/landing/` – public landing/login entry point.
- `users/client/` – client HTML/CSS/JS.
- `users/organizer/` – event organizer HTML/CSS/JS.
- `users/attendee/` – attendee HTML/CSS/JS.
- `users/staff/` – event staff HTML/CSS/JS.
- `users/super-admin/` – super admin HTML/CSS/JS.
- `users/employee1/` – registration & verification employee.
- `users/employee2/` – event operations employee.
- `users/employee3/` – support & finance employee.
- `images/` – frontend image assets.

## Entry point

Open `Index.html`, which redirects to `users/landing/index.html`.

After sign-in, the frontend opens the matching role page under `users/`. Unauthenticated visits to role pages return to the public landing page. Signing out returns to the same landing entry point.

## Refactor safety

The frontend was reorganized without rewriting application logic, IDs, role names, mock data, storage keys, function names, validation, navigation, or workflows. Shared CSS was merged into each role stylesheet, so there is no common CSS file. Shared JavaScript remains centralized because it is the existing SPA runtime used by the role entry points.
