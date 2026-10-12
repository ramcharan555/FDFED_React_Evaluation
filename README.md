# EventFlow — Event Registration & Attendee Management Platform

**A web-based platform for managing event registration, attendee information, event planning, and operational workflows through role-specific interfaces.**

## Overview

EventFlow is an event registration and attendee management platform designed to simplify event-related activities for clients, event organizers, attendees, staff, and administrators.

The platform provides role-specific workspaces to help users manage event requests, discover events, coordinate services, handle registrations, and oversee event operations. The project focuses on structured workflows, role-based access control, data validation, and a maintainable frontend-backend architecture.

The frontend is being migrated from HTML, CSS, and JavaScript to React, while the existing NestJS backend is retained.

## Key Features

- **Role-Based Workspaces:** Separate interfaces for clients, attendees, event organizers, staff, employees, and administrators.
- **Event Management:** Create, view, update, and manage event-related information according to user permissions.
- **Event Discovery:** Browse, search, and filter available events.
- **Registration Management:** Manage attendee registrations and registration status.
- **Organizer Coordination:** Support event planning, staff coordination, and operational workflows.
- **Staff Management:** Manage service information, availability, assignments, and responsibilities where supported.
- **Authentication and Authorization:** Protect user sessions and restrict access to authorized roles.
- **Form Validation:** Validate user inputs to improve data quality and prevent invalid submissions.
- **API Integration:** Connect frontend workflows to backend services.
- **Responsive Interface:** Design the application to support different screen sizes.

*Feature availability depends on the implementation and configuration of the corresponding frontend and backend workflows.*

## User Roles

| Role            | Responsibilities                                                              |
| --------------- | ----------------------------------------------------------------------------- |
| Client          | Submit event requirements, find organizers, and review event proposals.       |
| Attendee        | Discover events, register, and access registration information.               |
| Event Organizer | Coordinate event planning, manage event details, and oversee operations.      |
| Event Staff     | Manage service information, availability, and assigned responsibilities.      |
| Employee 1      | Support registration verification and attendee check-in where implemented.    |
| Employee 2      | Support event operations, schedules, and task coordination where implemented. |
| Employee 3      | Support customer service and payment-related workflows where implemented.     |
| Super Admin     | Manage users, permissions, and system-level operations.                       |

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- React (frontend migration target)
- Vite (planned React development and build tooling)

### Backend

- Node.js
- NestJS
- TypeScript
- REST API architecture

### Development Tools

- Git
- GitHub
- npm
- Visual Studio Code

The React and Vite stack represents the migration target. Refer to the frontend's `package.json` to determine which tools are currently configured.

## Project Structure

The repository separates the frontend and backend to support independent development and testing.

```text
EventFlow/
├── front-end/
│   ├── users/                 # Existing role-specific frontend pages
│   └── ...                    # Frontend assets and scripts
├── backend/
│   ├── src/                   # NestJS application source
│   ├── test/                  # Backend tests, where configured
│   └── package.json
└── README.md
```

### Planned React Structure

As the frontend migration progresses, the frontend can follow this structure:

```text
front-end/
├── public/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   └── routes.jsx
│   ├── components/
│   ├── services/
│   ├── users/
│   │   ├── client/
│   │   ├── attendee/
│   │   ├── organizer/
│   │   ├── staff/
│   │   ├── employee1/
│   │   ├── employee2/
│   │   ├── employee3/
│   │   └── super-admin/
│   └── styles/
├── package.json
└── vite.config.js
```

Each role should have its own page components and role-specific styling. Reusable components, such as buttons, form controls, navigation elements, and modals, can be shared where appropriate.

## Getting Started

### Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor

Verify your installation:

```bash
node --version
npm --version
git --version
```

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

Replace the placeholders with your GitHub repository URL and local folder name.

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

If your branch uses a different backend folder name, use the actual folder name in your repository.

### 3. Configure Environment Variables

Review the backend configuration to identify the environment variables required by your setup.

Create a local `.env` file if required, and configure the necessary development values, such as database connection details, authentication secrets, and API settings.

**Security note:** Never commit real passwords, API keys, authentication secrets, or production credentials to GitHub.

### 4. Start the Backend

From the backend directory, run:

```bash
npm run start:dev
```

For a production build, if the corresponding scripts are configured:

```bash
npm run build
npm run start:prod
```

Check the backend configuration for the actual host, port, and API routes.

### 5. Set Up the React Frontend

After the React migration and frontend configuration are complete, open a separate terminal:

```bash
cd front-end
npm install
npm run dev
```

These commands require a configured React frontend with the corresponding npm scripts.

For a production build, run:

```bash
npm run build
```

Open the local development URL displayed in the terminal.

> If the React migration is not complete, use the current frontend's existing execution instructions instead.

## Testing and Quality Assurance

Testing should cover both individual features and complete user workflows.

### Functional Testing

- Verify login, logout, session handling, and role-based navigation.
- Check that each role accesses only its permitted pages and actions.
- Test buttons, dropdowns, tabs, sidebars, modals, and notifications.
- Verify search, combined filters, sorting, and pagination.
- Validate required fields, email addresses, phone numbers, dates, prices, and quantities.
- Test create, update, delete, and cancellation workflows.
- Verify API error handling, loading indicators, and success messages.
- Confirm that data remains consistent after page refreshes.
- Check responsive layouts and browser console errors.

### Backend Testing

From the backend directory, run the scripts available in `package.json`. Typical commands include:

```bash
npm run build
npm run lint
npm run test
```

These commands should be used only when the corresponding scripts are configured. A successful build or lint check does not replace end-to-end testing.

## Security and Validation

The application should follow these principles:

- Enforce role-based authorization on protected backend endpoints.
- Validate and sanitize incoming data.
- Keep secrets and sensitive business logic on the server.
- Prevent unauthorized access to user and event information.
- Handle duplicate registration and payment submissions safely.
- Use secure authentication and session management practices.

Frontend validation improves usability but must not replace backend validation and authorization.

## Future Enhancements

Potential enhancements include:

- Event calendar and scheduling management.
- QR-code ticket verification and attendee check-in.
- Staff scheduling and task assignment.
- Event budget and expense tracking.
- Automated email and notification workflows.
- Payment gateway integration and transaction tracking.
- Waitlists and capacity management.
- Analytics dashboards and downloadable reports.
- Automated unit, integration, and end-to-end testing.
- Improved accessibility and responsive design.

These enhancements can be introduced incrementally based on project requirements.

##

##
