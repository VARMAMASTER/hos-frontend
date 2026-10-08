# Doctor Workspace (`doctor`)

**Category:** `clinical`  
**Icon:** `Dr`  
**Default Path:** `/doctor/queue`  
**Required Roles:** `ROLE_DOCTOR, ROLE_CLINICAL_HEAD`  

## Description
Queue, consultation scribe, progress notes, orders & Rx, case discussion, AI insights

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `queue` | My Queue | `/doctor/queue` | `26` | `<QueueWidget />` |
| `consult` | Consultation | `/doctor/consult` | — | `<ConsultWidget />` |
| `notes` | Progress Notes | `/doctor/notes` | — | `<NotesWidget />` |
| `orders` | Orders & Rx | `/doctor/orders` | — | `<OrdersWidget />` |
| `coding` | Coding & Claims | `/doctor/coding` | — | `<CodingWidget />` |
| `referrals` | Referrals Out | `/doctor/referrals` | — | `<ReferralsWidget />` |
| `history` | Patient History | `/doctor/history` | — | `<HistoryWidget />` |
| `discuss` | Case Discussion | `/doctor/discuss` | — | `<DiscussWidget />` |
| `aiteam` | My AI Team | `/doctor/aiteam` | — | `<AiteamWidget />` |
| `insights` | AI Insights | `/doctor/insights` | — | `<InsightsWidget />` |

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
