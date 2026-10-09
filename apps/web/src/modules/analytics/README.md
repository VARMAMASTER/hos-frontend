# Analytics & Insights (`analytics`)

**Category:** `intelligence`  
**Icon:** `An`  
**Default Path:** `/analytics/ask`  
**Required Roles:** `ROLE_OWNER, ROLE_ADMIN`

## Description

Ask anything NL queries, return on HOS, census occupancy trend, revenue leaderboard

## Tab Catalog

| Tab ID    | Label              | Route Path           | Badge | Widget Component    |
| --------- | ------------------ | -------------------- | ----- | ------------------- |
| `ask`     | Ask Anything       | `/analytics/ask`     | —     | `<AskWidget />`     |
| `roi`     | Return on HOS      | `/analytics/roi`     | —     | `<RoiWidget />`     |
| `census`  | Census & Occupancy | `/analytics/census`  | —     | `<CensusWidget />`  |
| `revenue` | Revenue Trends     | `/analytics/revenue` | —     | `<RevenueWidget />` |

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
