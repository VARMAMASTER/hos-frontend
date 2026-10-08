import type { RouteObject } from '../types';
import {
  BedboardWidget,
  IcuWidget,
  AdmissionsWidget,
  NursingWidget,
  DischargeWidget,
} from './tabs';

export const ipdRoutes: RouteObject[] = [
  {
    path: '/ipd',
    children: [
      {
        index: true,
        element: <BedboardWidget />,
      },
      {
        path: 'bedboard',
        element: <BedboardWidget />,
      },
      {
        path: 'icu',
        element: <IcuWidget />,
      },
      {
        path: 'admissions',
        element: <AdmissionsWidget />,
      },
      {
        path: 'nursing',
        element: <NursingWidget />,
      },
      {
        path: 'discharge',
        element: <DischargeWidget />,
      },
    ],
  },
];

export const routes = ipdRoutes;
