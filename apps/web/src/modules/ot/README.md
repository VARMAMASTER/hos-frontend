# Operation Theatre (`ot`)

**Category:** `clinical`  
**Icon:** `OT`  
**Default Path:** `/ot/schedule`  
**Required Roles:** `ROLE_SURGEON, ROLE_OT_NURSE, ROLE_ADMIN`

## Description

Theatre schedule, WHO surgical safety checklist, instruments & CSSD, implants, recovery

## Tab Catalog

| Tab ID        | Label              | Route Path        | Badge | Widget Component        |
| ------------- | ------------------ | ----------------- | ----- | ----------------------- |
| `schedule`    | OT Schedule        | `/ot/schedule`    | —     | `<ScheduleWidget />`    |
| `checklist`   | Safety Checklist   | `/ot/checklist`   | —     | `<ChecklistWidget />`   |
| `cssd`        | Instruments & CSSD | `/ot/cssd`        | —     | `<CssdWidget />`        |
| `implants`    | Implants           | `/ot/implants`    | —     | `<ImplantsWidget />`    |
| `store`       | Theatre Store      | `/ot/store`       | —     | `<StoreWidget />`       |
| `recovery`    | Recovery (PACU)    | `/ot/recovery`    | —     | `<RecoveryWidget />`    |
| `utilisation` | OT Utilisation     | `/ot/utilisation` | —     | `<UtilisationWidget />` |

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
