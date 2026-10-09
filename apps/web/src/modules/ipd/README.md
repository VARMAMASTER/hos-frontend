# Inpatient (IPD) (`ipd`)

**Category:** `clinical`  
**Icon:** `IP`  
**Default Path:** `/ipd/bedboard`  
**Required Roles:** `ROLE_NURSE, ROLE_DOCTOR, ROLE_ADMIN`

## Description

60-bed ward board, live ICU vitals, admissions, nursing station, discharge summary

## Tab Catalog

| Tab ID       | Label           | Route Path        | Badge   | Widget Component       |
| ------------ | --------------- | ----------------- | ------- | ---------------------- |
| `bedboard`   | Bed Board       | `/ipd/bedboard`   | `48/60` | `<BedboardWidget />`   |
| `icu`        | ICU & Emergency | `/ipd/icu`        | —       | `<IcuWidget />`        |
| `admissions` | Admissions      | `/ipd/admissions` | —       | `<AdmissionsWidget />` |
| `nursing`    | Nursing Station | `/ipd/nursing`    | —       | `<NursingWidget />`    |
| `discharge`  | Discharge       | `/ipd/discharge`  | —       | `<DischargeWidget />`  |

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
