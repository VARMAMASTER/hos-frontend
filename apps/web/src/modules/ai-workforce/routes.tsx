import type { RouteObject } from '../types';
import {
  OverviewWidget,
  WhatsappWidget,
  VoiceWidget,
  ScribeWidget,
  BillingWidget,
  DischargeLabWidget,
} from './tabs';

export const aiWorkforceRoutes: RouteObject[] = [
  {
    path: '/ai-workforce',
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
        path: 'whatsapp',
        element: <WhatsappWidget />,
      },
      {
        path: 'voice',
        element: <VoiceWidget />,
      },
      {
        path: 'scribe',
        element: <ScribeWidget />,
      },
      {
        path: 'billing',
        element: <BillingWidget />,
      },
      {
        path: 'discharge-lab',
        element: <DischargeLabWidget />,
      },
    ],
  },
];

export const routes = aiWorkforceRoutes;
