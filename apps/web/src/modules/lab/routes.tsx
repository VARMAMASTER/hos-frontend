import type { RouteObject } from '../types';
import {
  QueueWidget,
  CriticalWidget,
  TrackingWidget,
  AnalyzerWidget,
  EntryWidget,
  TatWidget,
  ReportsWidget,
} from './tabs';

export const labRoutes: RouteObject[] = [
  {
    path: '/lab',
    children: [
      {
        index: true,
        element: <QueueWidget />,
      },
      {
        path: 'queue',
        element: <QueueWidget />,
      },
      {
        path: 'critical',
        element: <CriticalWidget />,
      },
      {
        path: 'tracking',
        element: <TrackingWidget />,
      },
      {
        path: 'analyzer',
        element: <AnalyzerWidget />,
      },
      {
        path: 'entry',
        element: <EntryWidget />,
      },
      {
        path: 'tat',
        element: <TatWidget />,
      },
      {
        path: 'reports',
        element: <ReportsWidget />,
      },
    ],
  },
];

export const routes = labRoutes;
