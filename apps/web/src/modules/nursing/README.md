# Ward Nursing (`nursing`)

**Category:** `clinical`  
**Icon:** `Nu`  
**Default Path:** `/nursing/patients`  
**Required Roles:** `ROLE_NURSE`  

## Description
My patients, SBAR shift handover, medication round eMAR, ward stock, voice vitals, assessments

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `patients` | My Patients | `/nursing/patients` | `8` | `<PatientsWidget />` |
| `handover` | Shift Handover | `/nursing/handover` | — | `<HandoverWidget />` |
| `meds` | Medication Round | `/nursing/meds` | — | `<MedsWidget />` |
| `stock` | Ward Stock | `/nursing/stock` | — | `<StockWidget />` |
| `vitals` | Vitals & Charting | `/nursing/vitals` | — | `<VitalsWidget />` |
| `assessments` | Assessments | `/nursing/assessments` | — | `<AssessmentsWidget />` |
| `careplans` | Care Plans | `/nursing/careplans` | — | `<CareplansWidget />` |

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
