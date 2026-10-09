# Doctor (`doctor`)

**Category:** `clinical`  
**Icon:** `Dr`  
**Default Path:** `/doctor/queue`  
**Required Roles:** `ROLE_DOCTOR, ROLE_CLINICAL_HEAD`

## Description

Queue, consultation scribe, progress notes, orders & Rx, case discussion, AI insights

## Tab Catalog

| Tab ID      | Label           | Route Path          | Badge | Widget Component      |
| ----------- | --------------- | ------------------- | ----- | --------------------- |
| `queue`     | My Queue        | `/doctor/queue`     | `26`  | `<QueueWidget />`     |
| `consult`   | Consultation    | `/doctor/consult`   | —     | `<ConsultWidget />`   |
| `notes`     | Progress Notes  | `/doctor/notes`     | —     | `<NotesWidget />`     |
| `orders`    | Orders & Rx     | `/doctor/orders`    | —     | `<OrdersWidget />`    |
| `coding`    | Coding & Claims | `/doctor/coding`    | —     | `<CodingWidget />`    |
| `referrals` | Referrals Out   | `/doctor/referrals` | —     | `<ReferralsWidget />` |
| `history`   | Patient History | `/doctor/history`   | —     | `<HistoryWidget />`   |
| `discuss`   | Case Discussion | `/doctor/discuss`   | —     | `<DiscussWidget />`   |
| `aiteam`    | My AI Team      | `/doctor/aiteam`    | —     | `<AiteamWidget />`    |
| `insights`  | AI Insights     | `/doctor/insights`  | —     | `<InsightsWidget />`  |

## Architecture & Composable Widget Contract

All tabs within this module are organized under the tab-as-a-folder architecture:

- `tabs/<tab-id>/types.ts`: Props interface extending `ComposableWidgetProps`
- `tabs/<tab-id>/<tab-id>-view.tsx`: Embeddable composable widget component
- `tabs/<tab-id>/index.ts`: Tab barrel export
- `tabs/index.ts`: Aggregator barrel exporting all tab widgets

## Data

The tabs never import the mock. They read and write through `useDoctor()` (and `useDoctorQuery`), which return a `DoctorDataSource` (`data/source.ts`, typed by `data/types.ts`). Until the app mounts `DoctorDataProvider` with the real API client, they share one in-memory `createMockDoctorSource()` (`data/mock.ts`, with invented sample data in `data/seed-*.ts`). Specs pass a stub source to check the loading, empty and error states.

The clinical rules the data layer keeps: no method returns a dose, a drug choice or a diagnosis; every method that files, sends, orders or prescribes something an AI drafted is called only from a person's approval; nothing is logged or stored in the browser.

## Curation Checklist

- [ ] Responsive layout adhering to Nova UI tokens
- [ ] Role-based access control and tenant entitlement checks
- [ ] Live updates / token queue subscriptions where applicable
- [x] Error boundary & loading skeletons implemented (each tab: loading, empty and error states)
- [x] Zero deep cross-module imports (strict architectural boundary)
