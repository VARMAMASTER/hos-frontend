import type { RouteObject } from '../types';
import {
  ArrivalsWidget,
  TriageWidget,
  FasttrackWidget,
  ObservationWidget,
  AmbulanceWidget,
  MlcWidget,
} from './tabs';

export const emergencyRoutes: RouteObject[] = [
  {
    path: '/emergency',
    children: [
      {
        index: true,
        element: <ArrivalsWidget />,
      },
      {
        path: 'arrivals',
        element: <ArrivalsWidget />,
      },
      {
        path: 'triage',
        element: <TriageWidget />,
      },
      {
        path: 'fasttrack',
        element: <FasttrackWidget />,
      },
      {
        path: 'observation',
        element: <ObservationWidget />,
      },
      {
        path: 'ambulance',
        element: <AmbulanceWidget />,
      },
      {
        path: 'mlc',
        element: <MlcWidget />,
      },
    ],
  },
];

export const routes = emergencyRoutes;
