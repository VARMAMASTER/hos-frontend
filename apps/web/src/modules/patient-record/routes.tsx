import type { RouteObject } from '../types';
import {
  SnapshotWidget,
  ProfileWidget,
  TimelineWidget,
  DocumentsWidget,
  FamilyWidget,
  PatientviewWidget,
} from './tabs';

export const patientRecordRoutes: RouteObject[] = [
  {
    path: '/patient-record',
    children: [
      {
        index: true,
        element: <SnapshotWidget />,
      },
      {
        path: 'snapshot',
        element: <SnapshotWidget />,
      },
      {
        path: 'profile',
        element: <ProfileWidget />,
      },
      {
        path: 'timeline',
        element: <TimelineWidget />,
      },
      {
        path: 'documents',
        element: <DocumentsWidget />,
      },
      {
        path: 'family',
        element: <FamilyWidget />,
      },
      {
        path: 'patientview',
        element: <PatientviewWidget />,
      },
    ],
  },
];

export const routes = patientRecordRoutes;
