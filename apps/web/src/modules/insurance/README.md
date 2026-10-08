# Insurance & Claims (`insurance`)

**Category:** `financial`  
**Icon:** `In`  
**Default Path:** `/insurance/eligibility`  
**Required Roles:** `ROLE_INSURANCE_DESK, ROLE_BILLING, ROLE_ADMIN`  

## Description
PM-JAY/TPA eligibility, pre-auth & enhancements, settlement & deductions, reimbursement, ageing

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `eligibility` | Eligibility | `/insurance/eligibility` | — | `<EligibilityWidget />` |
| `preauth` | Pre-auth & Enhancement | `/insurance/preauth` | — | `<PreauthWidget />` |
| `settlement` | Settlement & Deductions | `/insurance/settlement` | — | `<SettlementWidget />` |
| `reimbursement` | Reimbursement | `/insurance/reimbursement` | — | `<ReimbursementWidget />` |
| `payers` | Payers & Contracts | `/insurance/payers` | — | `<PayersWidget />` |
| `ageing` | Ageing by Payer | `/insurance/ageing` | — | `<AgeingWidget />` |

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
