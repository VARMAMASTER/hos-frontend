import type { RouteObject } from '../types';
import {
  AccreditationWidget,
  IncidentsWidget,
  InfectionWidget,
  MedicationWidget,
  MortalityWidget,
  AuditWidget,
  RiskWidget,
  SopsWidget,
} from './tabs';

export const qualityRoutes: RouteObject[] = [
  {
    path: '/quality',
    children: [
      {
        index: true,
        element: <AccreditationWidget />,
      },
      {
        path: 'accreditation',
        element: <AccreditationWidget />,
      },
      {
        path: 'incidents',
        element: <IncidentsWidget />,
      },
      {
        path: 'infection',
        element: <InfectionWidget />,
      },
      {
        path: 'medication',
        element: <MedicationWidget />,
      },
      {
        path: 'mortality',
        element: <MortalityWidget />,
      },
      {
        path: 'audit',
        element: <AuditWidget />,
      },
      {
        path: 'risk',
        element: <RiskWidget />,
      },
      {
        path: 'sops',
        element: <SopsWidget />,
      },
    ],
  },
];

export const routes = qualityRoutes;
