import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { OperationsPage } from '../pages/OperationsPage';
import { OperationDetailPage } from '../pages/OperationDetailPage';
import { MatchingPage } from '../pages/MatchingPage';
import { ScenariosPage } from '../pages/ScenariosPage';
import { InspectionsPage } from '../pages/InspectionsPage';
import { TransportPage } from '../pages/TransportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/operations',
    element: <OperationsPage />,
  },
  {
    path: '/operations/:id',
    element: <OperationDetailPage />,
  },
  {
    path: '/matching',
    element: <MatchingPage />,
  },
  {
    path: '/scenarios',
    element: <ScenariosPage />,
  },
  {
    path: '/inspections',
    element: <InspectionsPage />,
  },
  {
    path: '/transport',
    element: <TransportPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
