# Laboratory & Diagnostics (`lab`)

**Category:** `financial`  
**Icon:** `La`  
**Default Path:** `/lab/queue`  
**Required Roles:** `ROLE_LAB_TECH, ROLE_PATHOLOGIST, ROLE_ADMIN`

## Description

Order queue, critical results, sample tracking kanban, analyser interface, result entry, TAT

## Tab Catalog

| Tab ID     | Label              | Route Path      | Badge | Widget Component     |
| ---------- | ------------------ | --------------- | ----- | -------------------- |
| `queue`    | Order Queue        | `/lab/queue`    | `19`  | `<QueueWidget />`    |
| `critical` | Critical Results   | `/lab/critical` | `2`   | `<CriticalWidget />` |
| `tracking` | Sample Tracking    | `/lab/tracking` | —     | `<TrackingWidget />` |
| `analyzer` | Analyser Interface | `/lab/analyzer` | —     | `<AnalyzerWidget />` |
| `entry`    | Result Entry       | `/lab/entry`    | —     | `<EntryWidget />`    |
| `tat`      | TAT Intelligence   | `/lab/tat`      | —     | `<TatWidget />`      |
| `reports`  | Reports & Delivery | `/lab/reports`  | —     | `<ReportsWidget />`  |

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
