import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const Landing = lazy(() => import('../apps/landing/app/LandingApp.jsx'));
const CustomerSupport = lazy(() => import('../apps/customer-support/app/CustomerSupportApp.jsx'));
const Admin = lazy(() => import('../apps/admin/app/AdminApp.jsx'));
const Attendee = lazy(() => import('../apps/attendee/app/AttendeeApp.jsx'));
const Client = lazy(() => import('../apps/client/app/ClientApp.jsx'));
const SupportExecutive = lazy(() => import('../apps/support-executive/app/SupportExecutiveApp.jsx'));
const FinanceExecutive = lazy(() => import('../apps/finance-executive/app/FinanceExecutiveApp.jsx'));
const Organizer = lazy(() => import('../apps/organizer/app/OrganizerApp.jsx'));
const EventStaff = lazy(() => import('../apps/event-staff/app/EventStaffApp.jsx'));

export const routes = [
  { path: '/', element: <Landing /> },
  { path: '/landing', element: <Landing /> },
  { path: '/customer-support', element: <CustomerSupport /> },
  { path: '/admin', element: <Admin /> },
  { path: '/attendee', element: <Attendee /> },
  { path: '/client', element: <Client /> },
  { path: '/employee', element: <SupportExecutive /> },
  { path: '/employee1', element: <SupportExecutive /> },
  { path: '/employee2', element: <FinanceExecutive /> },
  { path: '/organizer', element: <Organizer /> },
  { path: '/staff', element: <EventStaff /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
