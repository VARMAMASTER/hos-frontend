# Patient Records (`patient-record`)

**Category:** `clinical`  
**Icon:** `Pt`  
**Default Path:** `/patient-record/snapshot`  
**Required Roles:** `ROLE_DOCTOR, ROLE_NURSE, ROLE_ADMIN`

## Description

Clinical snapshot, demographics, clinical timeline, document vault, family & consent

## Tab Catalog

| Tab ID        | Label             | Route Path                    | Badge | Widget Component        |
| ------------- | ----------------- | ----------------------------- | ----- | ----------------------- |
| `snapshot`    | Clinical Snapshot | `/patient-record/snapshot`    | —     | `<SnapshotWidget />`    |
| `profile`     | Profile           | `/patient-record/profile`     | —     | `<ProfileWidget />`     |
| `timeline`    | Timeline          | `/patient-record/timeline`    | —     | `<TimelineWidget />`    |
| `documents`   | Documents         | `/patient-record/documents`   | —     | `<DocumentsWidget />`   |
| `family`      | Family & Consent  | `/patient-record/family`      | —     | `<FamilyWidget />`      |
| `patientview` | Patient View      | `/patient-record/patientview` | —     | `<PatientviewWidget />` |

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
