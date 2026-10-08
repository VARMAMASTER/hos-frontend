# Administration (`administration`)

**Category:** `settings`  
**Icon:** `Ad`  
**Default Path:** `/administration/overview`  
**Required Roles:** `ROLE_ADMIN, ROLE_OWNER`  

## Description
Hospital profile, departments, staff & roles, tariff master, GST & templates, AI ethics committee, audit log

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `overview` | Overview | `/administration/overview` | — | `<OverviewWidget />` |
| `departments` | Departments | `/administration/departments` | — | `<DepartmentsWidget />` |
| `staff` | Staff & Roles | `/administration/staff` | — | `<StaffWidget />` |
| `tariff` | Tariff Master | `/administration/tariff` | — | `<TariffWidget />` |
| `gst` | GST & Templates | `/administration/gst` | — | `<GstWidget />` |
| `aiquality` | AI Quality & Ethics | `/administration/aiquality` | — | `<AiqualityWidget />` |
| `compliance` | Compliance & NABH | `/administration/compliance` | — | `<ComplianceWidget />` |
| `training` | Training Sandbox | `/administration/training` | — | `<TrainingWidget />` |
| `audit` | Audit Log | `/administration/audit` | — | `<AuditWidget />` |

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
