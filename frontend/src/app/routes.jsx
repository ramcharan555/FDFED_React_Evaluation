import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const Landing = lazy(() => import('../apps/landing/Landing.jsx'));
const CustomerSupport = lazy(() => import('../apps/support/CustomerSupport.jsx'));
const Admin = lazy(() => import('../apps/admin/Admin.jsx'));
const Attendee = lazy(() => import('../apps/attendee/Attendee.jsx'));
const Client = lazy(() => import('../apps/client/Client.jsx'));
const Employee1 = lazy(() => import('../apps/employee1/Employee1.jsx'));
const Employee2 = lazy(() => import('../apps/employee2/Employee2.jsx'));
const Employee3 = lazy(() => import('../apps/employee3/Employee3.jsx'));
const Organizer = lazy(() => import('../apps/organizer/Organizer.jsx'));

export const routes = [
  { path: '/', element: <Landing /> },
  { path: '/landing', element: <Landing /> },
  { path: '/customer-support', element: <CustomerSupport /> },
  { path: '/admin', element: <Admin /> },
  { path: '/attendee', element: <Attendee /> },
  { path: '/client', element: <Client /> },
  { path: '/employee1', element: <Employee1 /> },
  { path: '/employee2', element: <Employee2 /> },
  { path: '/employee3', element: <Employee3 /> },
  { path: '/organizer', element: <Organizer /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
