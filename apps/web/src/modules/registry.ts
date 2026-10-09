import type { ModuleManifest } from './types';
import { administrationManifest } from './administration/manifest';
import { aiWorkforceManifest } from './ai-workforce/manifest';
import { analyticsManifest } from './analytics/manifest';
import { billingManifest } from './billing/manifest';
import { doctorManifest } from './doctor/manifest';
import { emergencyManifest } from './emergency/manifest';
import { insuranceManifest } from './insurance/manifest';
import { ipdManifest } from './ipd/manifest';
import { labManifest } from './lab/manifest';
import { nursingManifest } from './nursing/manifest';
import { otManifest } from './ot/manifest';
import { patientRecordManifest } from './patient-record/manifest';
import { pharmacyManifest } from './pharmacy/manifest';
import { qualityManifest } from './quality/manifest';
import { receptionManifest } from './reception/manifest';
import { superadminManifest } from './superadmin/manifest';

// One source per module: each module owns its manifest.ts, and the registry only assembles them, in
// the sidebar's order (clinical first, the platform last). Change a module's tabs, roles or title in
// its own manifest.ts.
export const MODULE_REGISTRY: ModuleManifest[] = [
  // Clinical
  receptionManifest,
  doctorManifest,
  patientRecordManifest,
  ipdManifest,
  nursingManifest,
  otManifest,
  emergencyManifest,
  // Financial & ancillary
  billingManifest,
  insuranceManifest,
  pharmacyManifest,
  labManifest,
  // Intelligence & governance
  analyticsManifest,
  aiWorkforceManifest,
  qualityManifest,
  // Settings & platform
  administrationManifest,
  superadminManifest,
];

export function getModuleManifest(id: string): ModuleManifest | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getEntitledModules(
  tenantModules: string[],
  userRoles: string[],
): ModuleManifest[] {
  return MODULE_REGISTRY.filter((module) => {
    const isTenantEntitled = tenantModules.includes(module.id);
    const isRoleAuthorized =
      module.requiredRoles.some((r) => userRoles.includes(r)) ||
      userRoles.includes('ROLE_SUPERADMIN');
    return isTenantEntitled && isRoleAuthorized;
  });
}
