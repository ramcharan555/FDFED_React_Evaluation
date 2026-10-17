import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes.jsx';

export default function App() {
  return <Suspense fallback={null}>{useRoutes(routes)}</Suspense>;
}
