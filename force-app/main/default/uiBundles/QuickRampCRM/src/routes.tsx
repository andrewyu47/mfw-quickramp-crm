import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Home from './pages/Home';
import Clinics from './pages/Clinics';
import Clinic from './pages/Clinic';
import Eval from './pages/Eval';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        handle: { showInNavigation: true, label: 'Home' },
      },
      {
        path: 'clinics',
        element: <Clinics />,
        handle: { showInNavigation: true, label: 'Customer Clinics' },
      },
      {
        path: 'clinics/:id',
        element: <Clinic />,
        // Detail page reached via the list — intentionally not in the nav.
      },
      {
        path: 'eval',
        element: <Eval />,
        handle: { showInNavigation: true, label: 'AI-Readability Eval' },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
