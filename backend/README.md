# Event Management & Coordination System - Backend

Complete NestJS backend with in-memory data structures and role-based access control (RBAC).

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [RBAC System](#rbac-system)
- [Frontend Integration](#frontend-integration)
- [Data Models](#data-models)
- [Testing with Postman/cURL](#testing)
- [Architecture Explanation](#architecture-explanation)

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/
│   │   ├── constants.ts              # Role and permission constants
│   │   ├── data-store.ts             # In-memory data structure singleton
│   │   ├── decorators/
│   │   │   ├── required-roles.decorator.ts
│   │   │   └── user-role.decorator.ts
│   │   ├── guards/
│   │   │   └── role.guard.ts         # RBAC Guard
│   │   └── interceptors/
│   │       └── activity-logging.interceptor.ts
│   ├── modules/
│   │   ├── events/
│   │   │   ├── dtos/
│   │   │   │   └── event.dto.ts
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   └── events.module.ts
│   │   ├── attendees/
│   │   │   ├── dtos/
│   │   │   │   └── attendee.dto.ts
│   │   │   ├── attendees.controller.ts
│   │   │   ├── attendees.service.ts
│   │   │   └── attendees.module.ts
│   │   ├── staff/
│   │   │   ├── dtos/
│   │   │   │   └── staff.dto.ts
│   │   │   ├── staff.controller.ts
│   │   │   ├── staff.service.ts
│   │   │   └── staff.module.ts
│   │   └── activity-log/
│   │       ├── activity-log.controller.ts
│   │       ├── activity-log.service.ts
│   │       └── activity-log.module.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md (this file)
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Verify Installation

```bash
npm ls @nestjs/core
npm ls typescript
```

---

## ▶️ Running the Backend

### Development Mode (with auto-reload)

```bash
npm run start:dev
```

The server will start on `http://localhost:3001`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

This allows you to connect a debugger to port 9229

### Expected Output

```
[Nest] 12345   - 05/02/2024, 3:45:00 PM   LOG [NestFactory] Starting Nest application...
[Nest] 12345   - 05/02/2024, 3:45:00 PM   LOG [InstanceLoader] AppModule dependencies initialized
🚀 Server running on http://localhost:3001
📚 Swagger API Docs: http://localhost:3001/api
```

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:3001
```

### Required Header

All requests must include:

```
role: superuser | admin | attendee
```

---

### 📅 EVENTS ENDPOINTS

#### Get All Events

```http
GET /events?search=&status=upcoming
Headers: role: attendee
```

**Response:**

```json
[
  {
    "id": "evt-001",
    "name": "College Orientation 2024",
    "description": "Welcome event for new students",
    "date": "2024-06-15",
    "location": "Main Auditorium",
    "organizerId": "staff-001",
    "attendees": ["att-001", "att-002"],
    "capacity": 500,
    "status": "upcoming",
    "createdAt": "2024-05-02T10:30:00.000Z",
    "updatedAt": "2024-05-02T10:30:00.000Z"
  }
]
```

#### Get Event by ID

```http
GET /events/:id
Headers: role: attendee
```

#### Create Event (Admin/Superuser only)

```http
POST /events
Headers: role: admin, Content-Type: application/json

Body:
{
  "name": "New Event",
  "description": "Event description",
  "date": "2024-06-20",
  "location": "Hall A",
  "organizerId": "staff-001",
  "capacity": 300
}
```

#### Update Event (Admin/Superuser only)

```http
PUT /events/:id
Headers: role: admin, Content-Type: application/json

Body:
{
  "name": "Updated Event Name",
  "status": "ongoing"
}
```

#### Delete Event (Superuser only)

```http
DELETE /events/:id
Headers: role: superuser
```

#### Add Attendee to Event

```http
POST /events/:id/attendees/:attendeeId
Headers: role: attendee
```

#### Remove Attendee from Event

```http
DELETE /events/:id/attendees/:attendeeId
Headers: role: attendee
```

#### Get Event Statistics

```http
GET /events/statistics
Headers: role: attendee
```

---

### 👥 ATTENDEES ENDPOINTS

#### Get All Attendees

```http
GET /attendees?search=John
Headers: role: admin
```

#### Get Attendee by ID

```http
GET /attendees/:id
Headers: role: admin
```

#### Create Attendee (Admin/Superuser only)

```http
POST /attendees
Headers: role: admin, Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "registeredEvents": ["evt-001"]
}
```

#### Update Attendee (Admin/Superuser only)

```http
PUT /attendees/:id
Headers: role: admin, Content-Type: application/json

Body:
{
  "name": "Jane Doe",
  "status": "active"
}
```

#### Delete Attendee (Superuser only)

```http
DELETE /attendees/:id
Headers: role: superuser
```

#### Get Attendee Statistics

```http
GET /attendees/statistics
Headers: role: admin
```

---

### 👔 STAFF ENDPOINTS

#### Get All Staff (Admin/Superuser only)

```http
GET /staff?search=Alice
Headers: role: admin
```

#### Get Staff by ID (Admin/Superuser only)

```http
GET /staff/:id
Headers: role: admin
```

#### Create Staff (Superuser only)

```http
POST /staff
Headers: role: superuser, Content-Type: application/json

Body:
{
  "name": "Alice Manager",
  "role": "manager",
  "email": "alice@college.edu",
  "availability": ["Monday", "Wednesday", "Friday"],
  "assignedEvents": ["evt-001"]
}
```

#### Update Staff (Superuser only)

```http
PUT /staff/:id
Headers: role: superuser, Content-Type: application/json

Body:
{
  "name": "Bob Manager",
  "status": "inactive"
}
```

#### Delete Staff (Superuser only)

```http
DELETE /staff/:id
Headers: role: superuser
```

#### Assign Event to Staff (Superuser only)

```http
POST /staff/:id/events/:eventId
Headers: role: superuser
```

#### Get Staff Statistics

```http
GET /staff/statistics
Headers: role: admin
```

---

### 📊 ACTIVITY LOGS ENDPOINTS

#### Get All Activity Logs

```http
GET /activity-logs?limit=100&offset=0
Headers: role: admin
```

#### Get Logs by Role

```http
GET /activity-logs/by-role/:role
Headers: role: admin
```

#### Get Activity Statistics

```http
GET /activity-logs/statistics
Headers: role: admin
```

#### Clear All Logs

```http
DELETE /activity-logs
Headers: role: superuser
```

---

## 🔐 RBAC System

### Roles & Permissions

| Operation       | Superuser | Admin | Attendee |
| --------------- | :-------: | :---: | :------: |
| Create Event    |    ✅     |  ✅   |    ❌    |
| Update Event    |    ✅     |  ✅   |    ❌    |
| Delete Event    |    ✅     |  ❌   |    ❌    |
| View Events     |    ✅     |  ✅   |    ✅    |
| Create Attendee |    ✅     |  ✅   |    ❌    |
| Delete Attendee |    ✅     |  ❌   |    ❌    |
| Create Staff    |    ✅     |  ❌   |    ❌    |
| View Staff      |    ✅     |  ✅   |    ❌    |
| Delete Staff    |    ✅     |  ❌   |    ❌    |

### Implementation Details

1. **RoleGuard** - Validates role header and attaches role to request
2. **Decorators** - `@UserRoleDecorator()` extracts role from request
3. **Service Layer** - Each service checks role permissions
4. **HTTP Exceptions** - Returns 400/403 for permission violations

---

## 🖥️ Frontend Integration

### Using the API Service

#### 1. Import API Service

```html
<script src="js/api-service.js"></script>
```

#### 2. Initialize

```javascript
const api = new ApiService("http://localhost:3001");
```

#### 3. Set Role

```javascript
api.setRole("admin"); // or 'superuser', 'attendee'
```

#### 4. Call API Methods

```javascript
// Get all events
const events = await api.getEvents();

// Create event
const newEvent = await api.createEvent({
  name: "New Event",
  date: "2024-06-20",
  location: "Hall A",
  organizerId: "staff-001",
  capacity: 300,
});

// Update event
await api.updateEvent("evt-001", {
  name: "Updated Name",
});

// Delete event
await api.deleteEvent("evt-001");
```

### HTML Integration

Use the provided `integrated-index.html` which includes:

- Role selector dropdown
- Search functionality
- Create event modal
- Event listing with CRUD buttons
- Role-based UI restrictions
- Loading and error handling
- Activity tracking

---

## 📊 Data Models

### Event

```typescript
{
  id: string;
  name: string;
  description: string;
  date: string;              // YYYY-MM-DD
  location: string;
  organizerId: string;
  attendees: string[];       // Array of attendee IDs
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### Attendee

```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredEvents: string[];  // Array of event IDs
  joinDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### Staff

```typescript
{
  id: string;
  name: string;
  role: 'coordinator' | 'support' | 'manager';
  email: string;
  availability: string[];    // Days of week
  assignedEvents: string[];  // Array of event IDs
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity Log

```typescript
{
  id: string;
  action: string;            // POST, PUT, DELETE, etc.
  resource: string;          // API endpoint
  role: string;              // User role
  timestamp: Date;
  status: string;            // 'success', 'error'
  details?: any;             // Response data
}
```

---

## 🧪 Testing

### Using cURL

#### Test Create Event

```bash
curl -X POST http://localhost:3001/events \
  -H "role: admin" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Conference 2024",
    "description": "Annual tech conference",
    "date": "2024-07-15",
    "location": "Convention Center",
    "organizerId": "staff-001",
    "capacity": 500
  }'
```

#### Test Get All Events

```bash
curl http://localhost:3001/events \
  -H "role: attendee"
```

#### Test Delete Event (Superuser only)

```bash
curl -X DELETE http://localhost:3001/events/evt-001 \
  -H "role: superuser"
```

### Using Postman

1. Import API endpoints
2. Set Collection-level variable `role` = `admin`
3. Add `role` header to all requests
4. Test different roles to see RBAC in action

### Using the Browser

1. Go to `http://localhost:3001/api`
2. Swagger documentation will open
3. Test endpoints directly from the UI
4. Add role header in the "Try it out" interface

---

## 🏗️ Architecture Explanation

### Modular Architecture

Each feature is a self-contained module with:

- **Controller** - Handles HTTP requests
- **Service** - Business logic
- **DTOs** - Data validation and documentation
- **Module** - Assembles the feature

### Dependency Injection

All dependencies are managed by NestJS's DI container:

```typescript
constructor(private readonly eventsService: EventsService) {}
```

### Data Persistence

In-memory data using Singleton pattern:

```typescript
const dataStore = DataStore.getInstance();
```

Data is reset on server restart. For production, replace with a real database.

### Guards & Decorators

- **RoleGuard** - Global guard applied to protected routes
- **@UserRoleDecorator()** - Extracts role from request headers
- **@RequiredRoles()** - Specifies required roles (not used in this implementation but available)

### Exception Handling

NestJS built-in exceptions:

- `NotFoundException` - 404
- `BadRequestException` - 400
- `ForbiddenException` - 403
- `UnauthorizedException` - 401

---

## 📝 Important Files for Viva

When explaining to examiners, highlight:

1. **src/common/data-store.ts** - Data structures and singleton pattern
2. **src/common/guards/role.guard.ts** - RBAC implementation
3. **src/modules/events/events.service.ts** - Business logic example
4. **src/modules/events/events.controller.ts** - REST API design
5. **js/api-service.js** - Frontend integration
6. **integrated-index.html** - Complete UI example

---

## 🔄 Full Workflow Example

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

### 2. Frontend

Open `integrated-index.html` in browser or:

```bash
# Start a simple HTTP server in the project root
python -m http.server 5000
# or
npx http-server
```

### 3. Test Flow

1. Select "Admin" role
2. Click "Create Event"
3. Fill event details and submit
4. View event in the list
5. Switch to "Attendee" role
6. Register for event (note: create/delete buttons disappear)
7. Check Swagger docs at `http://localhost:3001/api`

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use a different port
PORT=3002 npm run start:dev
```

### CORS Issues

The backend already has CORS enabled for `localhost:3000` and `localhost:5000`. Update if needed in `main.ts`.

### Validation Errors

Ensure DTO validation passes:

- Required fields are present
- Email format is valid
- Dates are in YYYY-MM-DD format

### Permission Denied

Always pass the correct role header. Test with:

```bash
curl -H "role: attendee" http://localhost:3001/events
```

---

## 📚 Additional Resources

- [NestJS Docs](https://docs.nestjs.com)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction)

---

## 📄 License

This project is provided for educational purposes as part of the FFSD Review-4 college project.

---

**Created for FFSD (Full Stack Software Development) College Project**
**Event Management & Coordination System Backend**
