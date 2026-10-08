# Reception / OPD (`reception`)

**Category:** `clinical`  
**Icon:** `Re`  
**Default Path:** `/reception/queue`  
**Required Roles:** `ROLE_RECEPTION, ROLE_ADMIN`  

## Description
Live token queue, appointments, registration, AI calling, referrals

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
| `queue` | Live Queue | `/reception/queue` | `14` | `<QueueWidget />` |
| `appointments` | Appointments | `/reception/appointments` | — | `<AppointmentsWidget />` |
| `schedule` | Day Schedule | `/reception/schedule` | — | `<ScheduleWidget />` |
| `registration` | Registration | `/reception/registration` | — | `<RegistrationWidget />` |
| `admission` | Admission | `/reception/admission` | — | `<AdmissionWidget />` |
| `aicalling` | AI Calling | `/reception/aicalling` | — | `<AicallingWidget />` |
| `whatsapp` | WhatsApp Assistant | `/reception/whatsapp` | — | `<WhatsappWidget />` |
| `referrals` | Referrals | `/reception/referrals` | — | `<ReferralsWidget />` |

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
