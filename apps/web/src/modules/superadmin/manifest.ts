import type { ModuleManifest } from '../types';

export const superadminManifest: ModuleManifest = {
  "id": "superadmin",
  "title": "HOS HQ Superadmin",
  "category": "platform",
  "icon": "HQ",
  "requiredRoles": [
    "ROLE_SUPERADMIN"
  ],
  "defaultPath": "/superadmin/tenants",
  "description": "Fleet tenants, plans & pricing, usage metering, AI fleet kill switch, releases, system health, telemetry",
  "tabs": [
    {
      "id": "tenants",
      "label": "Tenants",
      "path": "/superadmin/tenants"
    },
    {
      "id": "plans",
      "label": "Plans & Pricing",
      "path": "/superadmin/plans"
    },
    {
      "id": "usage",
      "label": "Usage Metering",
      "path": "/superadmin/usage"
    },
    {
      "id": "aicontrol",
      "label": "AI Fleet Control",
      "path": "/superadmin/aicontrol"
    },
    {
      "id": "releases",
      "label": "Release & Rollout",
      "path": "/superadmin/releases"
    },
    {
      "id": "incidents",
      "label": "Incidents",
      "path": "/superadmin/incidents"
    },
    {
      "id": "health",
      "label": "System Health",
      "path": "/superadmin/health"
    },
    {
      "id": "observability",
      "label": "Telemetry & Logs",
      "path": "/superadmin/observability"
    },
    {
      "id": "support",
      "label": "Tickets & Issues",
      "path": "/superadmin/support"
    },
    {
      "id": "provisioning",
      "label": "Provisioning",
      "path": "/superadmin/provisioning"
    },
    {
      "id": "team",
      "label": "HOS Team",
      "path": "/superadmin/team"
    },
    {
      "id": "breakglass",
      "label": "Break-glass Log",
      "path": "/superadmin/breakglass"
    }
  ]
};

export const manifest = superadminManifest;
