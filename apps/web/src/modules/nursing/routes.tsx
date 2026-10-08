import type { RouteObject } from '../types';
import {
  PatientsWidget,
  HandoverWidget,
  MedsWidget,
  StockWidget,
  VitalsWidget,
  AssessmentsWidget,
  CareplansWidget,
} from './tabs';

export const nursingRoutes: RouteObject[] = [
  {
    path: '/nursing',
    children: [
      {
        index: true,
        element: <PatientsWidget />,
      },
      {
        path: 'patients',
        element: <PatientsWidget />,
      },
      {
        path: 'handover',
        element: <HandoverWidget />,
      },
      {
        path: 'meds',
        element: <MedsWidget />,
      },
      {
        path: 'stock',
        element: <StockWidget />,
      },
      {
        path: 'vitals',
        element: <VitalsWidget />,
      },
      {
        path: 'assessments',
        element: <AssessmentsWidget />,
      },
      {
        path: 'careplans',
        element: <CareplansWidget />,
      },
    ],
  },
];

export const routes = nursingRoutes;
