# EventFlow Role-Owned Frontend Structure

Each EventFlow role now owns its complete frontend implementation in its own folder.

Every role folder contains:
- a complete HTML application page
- a complete CSS stylesheet for that page
- a complete JavaScript bundle containing the frontend runtime dependencies and application logic

Roles:
- client
- attendee
- organizer
- staff
- super-admin
- employee1
- employee2
- employee3

There is no `users/shared/js` dependency in the role pages.

The public landing page is the single sign-in entry point. After authentication, sessions are routed to the matching role page; unauthenticated visits to role pages return to the landing page. Signing out also returns to the landing page.

The application logic was preserved by combining the existing frontend scripts in their original load order into each role-owned JavaScript bundle. Asset paths were adjusted only for the new folder depth.
