import type { RouteObject } from '../types';
import {
  ScheduleWidget,
  ChecklistWidget,
  CssdWidget,
  ImplantsWidget,
  StoreWidget,
  RecoveryWidget,
  UtilisationWidget,
} from './tabs';

export const otRoutes: RouteObject[] = [
  {
    path: '/ot',
    children: [
      {
        index: true,
        element: <ScheduleWidget />,
      },
      {
        path: 'schedule',
        element: <ScheduleWidget />,
      },
      {
        path: 'checklist',
        element: <ChecklistWidget />,
      },
      {
        path: 'cssd',
        element: <CssdWidget />,
      },
      {
        path: 'implants',
        element: <ImplantsWidget />,
      },
      {
        path: 'store',
        element: <StoreWidget />,
      },
      {
        path: 'recovery',
        element: <RecoveryWidget />,
      },
      {
        path: 'utilisation',
        element: <UtilisationWidget />,
      },
    ],
  },
];

export const routes = otRoutes;
