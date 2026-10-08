# Quality & Accreditation (`quality`)

**Category:** `governance`  
**Icon:** `Qs`  
**Default Path:** `/quality/accreditation`  
**Required Roles:** `ROLE_QUALITY_NURSE, ROLE_NABH_COORDINATOR, ROLE_ADMIN`  

## Description
NABH accreditation evidence ledger, incident reporting, HAI infection surveillance, mortality review, audit loops

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `accreditation` | Accreditation | `/quality/accreditation` | — | `<AccreditationWidget />` |
| `incidents` | Incidents | `/quality/incidents` | — | `<IncidentsWidget />` |
| `infection` | Infection Control | `/quality/infection` | — | `<InfectionWidget />` |
| `medication` | Medication Safety | `/quality/medication` | — | `<MedicationWidget />` |
| `mortality` | Mortality Review | `/quality/mortality` | — | `<MortalityWidget />` |
| `audit` | Clinical Audit | `/quality/audit` | — | `<AuditWidget />` |
| `risk` | Risk Register | `/quality/risk` | — | `<RiskWidget />` |
| `sops` | SOP Library | `/quality/sops` | — | `<SopsWidget />` |

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
