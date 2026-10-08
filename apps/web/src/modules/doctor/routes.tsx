import type { RouteObject } from '../types';
import {
  QueueWidget,
  ConsultWidget,
  NotesWidget,
  OrdersWidget,
  CodingWidget,
  ReferralsWidget,
  HistoryWidget,
  DiscussWidget,
  AiteamWidget,
  InsightsWidget,
} from './tabs';

export const doctorRoutes: RouteObject[] = [
  {
    path: '/doctor',
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
        path: 'consult',
        element: <ConsultWidget />,
      },
      {
        path: 'notes',
        element: <NotesWidget />,
      },
      {
        path: 'orders',
        element: <OrdersWidget />,
      },
      {
        path: 'coding',
        element: <CodingWidget />,
      },
      {
        path: 'referrals',
        element: <ReferralsWidget />,
      },
      {
        path: 'history',
        element: <HistoryWidget />,
      },
      {
        path: 'discuss',
        element: <DiscussWidget />,
      },
      {
        path: 'aiteam',
        element: <AiteamWidget />,
      },
      {
        path: 'insights',
        element: <InsightsWidget />,
      },
    ],
  },
];

export const routes = doctorRoutes;
