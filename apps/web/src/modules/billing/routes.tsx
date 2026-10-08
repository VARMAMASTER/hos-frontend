import type { RouteObject } from '../types';
import {
  ComposerWidget,
  AdvancesWidget,
  GstWidget,
  ClaimsWidget,
  ArWidget,
} from './tabs';

export const billingRoutes: RouteObject[] = [
  {
    path: '/billing',
    children: [
      {
        index: true,
        element: <ComposerWidget />,
      },
      {
        path: 'composer',
        element: <ComposerWidget />,
      },
      {
        path: 'advances',
        element: <AdvancesWidget />,
      },
      {
        path: 'gst',
        element: <GstWidget />,
      },
      {
        path: 'claims',
        element: <ClaimsWidget />,
      },
      {
        path: 'ar',
        element: <ArWidget />,
      },
    ],
  },
];

export const routes = billingRoutes;
