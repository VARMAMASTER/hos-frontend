# HOS HQ Superadmin (`superadmin`)

**Category:** `platform`  
**Icon:** `HQ`  
**Default Path:** `/superadmin/tenants`  
**Required Roles:** `ROLE_SUPERADMIN`  

## Description
Fleet tenants, plans & pricing, usage metering, AI fleet kill switch, releases, system health, telemetry

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `tenants` | Tenants | `/superadmin/tenants` | — | `<TenantsWidget />` |
| `plans` | Plans & Pricing | `/superadmin/plans` | — | `<PlansWidget />` |
| `usage` | Usage Metering | `/superadmin/usage` | — | `<UsageWidget />` |
| `aicontrol` | AI Fleet Control | `/superadmin/aicontrol` | — | `<AicontrolWidget />` |
| `releases` | Release & Rollout | `/superadmin/releases` | — | `<ReleasesWidget />` |
| `incidents` | Incidents | `/superadmin/incidents` | — | `<IncidentsWidget />` |
| `health` | System Health | `/superadmin/health` | — | `<HealthWidget />` |
| `observability` | Telemetry & Logs | `/superadmin/observability` | — | `<ObservabilityWidget />` |
| `support` | Tickets & Issues | `/superadmin/support` | — | `<SupportWidget />` |
| `provisioning` | Provisioning | `/superadmin/provisioning` | — | `<ProvisioningWidget />` |
| `team` | HOS Team | `/superadmin/team` | — | `<TeamWidget />` |
| `breakglass` | Break-glass Log | `/superadmin/breakglass` | — | `<BreakglassWidget />` |

## Architecture & Composable Widget Contract
All tabs within this module are organized under the tab-as-a-folder architecture:
- `tabs/<tab-id>/types.ts`: Props interface extending `ComposableWidgetProps`
- `tabs/<tab-id>/<tab-id>-view.tsx`: Embeddable composable widget component
- `tabs/<tab-id>/index.ts`: Tab barrel export
- `tabs/index.ts`: Aggregator barrel exporting all tab widgets

## Curation Checklist
- [ ] Responsive layout adhering to Nova UI tokens
- [ ] Role-based access control and tenant entitlement checks
- [ ] Live updates / token queue subscriptions where applicable
- [ ] Error boundary & loading skeletons implemented
- [ ] Zero deep cross-module imports (strict architectural boundary)
