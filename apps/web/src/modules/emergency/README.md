# Emergency & Casualty (`emergency`)

**Category:** `clinical`  
**Icon:** `ER`  
**Default Path:** `/emergency/arrivals`  
**Required Roles:** `ROLE_EMERGENCY_DOC, ROLE_NURSE, ROLE_ADMIN`

## Description

Unknown patient intake, triage board, fast track, observation clocks, ambulance, MLC register

## Tab Catalog

| Tab ID        | Label        | Route Path               | Badge | Widget Component        |
| ------------- | ------------ | ------------------------ | ----- | ----------------------- |
| `arrivals`    | Arrivals     | `/emergency/arrivals`    | `3`   | `<ArrivalsWidget />`    |
| `triage`      | Triage Board | `/emergency/triage`      | —     | `<TriageWidget />`      |
| `fasttrack`   | Fast Track   | `/emergency/fasttrack`   | —     | `<FasttrackWidget />`   |
| `observation` | Observation  | `/emergency/observation` | —     | `<ObservationWidget />` |
| `ambulance`   | Ambulance    | `/emergency/ambulance`   | —     | `<AmbulanceWidget />`   |
| `mlc`         | MLC Register | `/emergency/mlc`         | —     | `<MlcWidget />`         |

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
