import type { RouteObject } from '../types';
import { AskWidget, RoiWidget, CensusWidget, RevenueWidget } from './tabs';

export const analyticsRoutes: RouteObject[] = [
  {
    path: '/analytics',
    children: [
      {
        index: true,
        element: <AskWidget />,
      },
      {
        path: 'ask',
        element: <AskWidget />,
      },
      {
        path: 'roi',
        element: <RoiWidget />,
      },
      {
        path: 'census',
        element: <CensusWidget />,
      },
      {
        path: 'revenue',
        element: <RevenueWidget />,
      },
    ],
  },
];

export const routes = analyticsRoutes;
