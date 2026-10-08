import type { RouteObject } from '../types';
import {
  TenantsWidget,
  PlansWidget,
  UsageWidget,
  AicontrolWidget,
  ReleasesWidget,
  IncidentsWidget,
  HealthWidget,
  ObservabilityWidget,
  SupportWidget,
  ProvisioningWidget,
  TeamWidget,
  BreakglassWidget,
} from './tabs';

export const superadminRoutes: RouteObject[] = [
  {
    path: '/superadmin',
    children: [
      {
        index: true,
        element: <TenantsWidget />,
      },
      {
        path: 'tenants',
        element: <TenantsWidget />,
      },
      {
        path: 'plans',
        element: <PlansWidget />,
      },
      {
        path: 'usage',
        element: <UsageWidget />,
      },
      {
        path: 'aicontrol',
        element: <AicontrolWidget />,
      },
      {
        path: 'releases',
        element: <ReleasesWidget />,
      },
      {
        path: 'incidents',
        element: <IncidentsWidget />,
      },
      {
        path: 'health',
        element: <HealthWidget />,
      },
      {
        path: 'observability',
        element: <ObservabilityWidget />,
      },
      {
        path: 'support',
        element: <SupportWidget />,
      },
      {
        path: 'provisioning',
        element: <ProvisioningWidget />,
      },
      {
        path: 'team',
        element: <TeamWidget />,
      },
      {
        path: 'breakglass',
        element: <BreakglassWidget />,
      },
    ],
  },
];

export const routes = superadminRoutes;
