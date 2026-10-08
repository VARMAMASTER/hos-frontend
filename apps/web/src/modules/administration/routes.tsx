import type { RouteObject } from '../types';
import {
  OverviewWidget,
  DepartmentsWidget,
  StaffWidget,
  TariffWidget,
  GstWidget,
  AiqualityWidget,
  ComplianceWidget,
  TrainingWidget,
  AuditWidget,
} from './tabs';

export const administrationRoutes: RouteObject[] = [
  {
    path: '/administration',
    children: [
      {
        index: true,
        element: <OverviewWidget />,
      },
      {
        path: 'overview',
        element: <OverviewWidget />,
      },
      {
        path: 'departments',
        element: <DepartmentsWidget />,
      },
      {
        path: 'staff',
        element: <StaffWidget />,
      },
      {
        path: 'tariff',
        element: <TariffWidget />,
      },
      {
        path: 'gst',
        element: <GstWidget />,
      },
      {
        path: 'aiquality',
        element: <AiqualityWidget />,
      },
      {
        path: 'compliance',
        element: <ComplianceWidget />,
      },
      {
        path: 'training',
        element: <TrainingWidget />,
      },
      {
        path: 'audit',
        element: <AuditWidget />,
      },
    ],
  },
];

export const routes = administrationRoutes;
