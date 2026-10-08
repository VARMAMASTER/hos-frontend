import type { RouteObject } from '../types';
import {
  QueueWidget,
  AppointmentsWidget,
  ScheduleWidget,
  RegistrationWidget,
  AdmissionWidget,
  AicallingWidget,
  WhatsappWidget,
  ReferralsWidget,
} from './tabs';

export const receptionRoutes: RouteObject[] = [
  {
    path: '/reception',
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
        path: 'appointments',
        element: <AppointmentsWidget />,
      },
      {
        path: 'schedule',
        element: <ScheduleWidget />,
      },
      {
        path: 'registration',
        element: <RegistrationWidget />,
      },
      {
        path: 'admission',
        element: <AdmissionWidget />,
      },
      {
        path: 'aicalling',
        element: <AicallingWidget />,
      },
      {
        path: 'whatsapp',
        element: <WhatsappWidget />,
      },
      {
        path: 'referrals',
        element: <ReferralsWidget />,
      },
    ],
  },
];

export const routes = receptionRoutes;
