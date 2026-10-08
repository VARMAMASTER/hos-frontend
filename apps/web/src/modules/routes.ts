import type { ReactNode } from 'react';
import type { RouteObject } from './types';
import { routes as administrationRoutes } from './administration/routes';
import { routes as aiWorkforceRoutes } from './ai-workforce/routes';
import { routes as analyticsRoutes } from './analytics/routes';
import { routes as billingRoutes } from './billing/routes';
import { routes as doctorRoutes } from './doctor/routes';
import { routes as emergencyRoutes } from './emergency/routes';
import { routes as insuranceRoutes } from './insurance/routes';
import { routes as ipdRoutes } from './ipd/routes';
import { routes as labRoutes } from './lab/routes';
import { routes as nursingRoutes } from './nursing/routes';
import { routes as otRoutes } from './ot/routes';
import { routes as patientRecordRoutes } from './patient-record/routes';
import { routes as pharmacyRoutes } from './pharmacy/routes';
import { routes as qualityRoutes } from './quality/routes';
import { routes as receptionRoutes } from './reception/routes';
import { routes as superadminRoutes } from './superadmin/routes';

export const MODULE_ROUTES: Record<string, RouteObject[]> = {
  administration: administrationRoutes,
  'ai-workforce': aiWorkforceRoutes,
  analytics: analyticsRoutes,
  billing: billingRoutes,
  doctor: doctorRoutes,
  emergency: emergencyRoutes,
  insurance: insuranceRoutes,
  ipd: ipdRoutes,
  lab: labRoutes,
  nursing: nursingRoutes,
  ot: otRoutes,
  'patient-record': patientRecordRoutes,
  pharmacy: pharmacyRoutes,
  quality: qualityRoutes,
  reception: receptionRoutes,
  superadmin: superadminRoutes,
};

export function getTabWidget(moduleId: string, tabId: string): ReactNode {
  const routes = MODULE_ROUTES[moduleId];
  if (!routes || routes.length === 0) return null;
  const root = routes[0];
  if (!root?.children) return root?.element ?? null;
  const match = root.children.find((c) => c.path === tabId);
  if (match?.element) return match.element;
  const indexMatch = root.children.find((c) => c.index);
  return indexMatch?.element ?? null;
}
