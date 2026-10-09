import { MODULE_REGISTRY } from '../modules/registry';

// What the demo and dev build grants, until sign-in and the tenant's entitlements come from the API
// (BLUEPRINT §5, §6): every module, for a platform superadmin. Passed explicitly by main.tsx, because
// the app itself grants nothing by default (entitlements fail closed).
export const DEMO_ENTITLEMENTS: {
  tenantModules: string[];
  userRoles: string[];
} = {
  tenantModules: MODULE_REGISTRY.map((module) => module.id),
  userRoles: ['ROLE_SUPERADMIN'],
};
