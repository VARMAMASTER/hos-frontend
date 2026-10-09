# Billing & Cashier (`billing`)

**Category:** `financial`  
**Icon:** `Bi`  
**Default Path:** `/billing/composer`  
**Required Roles:** `ROLE_BILLING, ROLE_ACCOUNTANT, ROLE_ADMIN`

## Description

Bill composer, AI line items, advances & packages, GST invoices, claims & pre-auth, AR

## Tab Catalog

| Tab ID     | Label               | Route Path          | Badge | Widget Component     |
| ---------- | ------------------- | ------------------- | ----- | -------------------- |
| `composer` | Bill Composer       | `/billing/composer` | —     | `<ComposerWidget />` |
| `advances` | Advances & Packages | `/billing/advances` | —     | `<AdvancesWidget />` |
| `gst`      | GST Invoices        | `/billing/gst`      | —     | `<GstWidget />`      |
| `claims`   | Claims & Pre-auth   | `/billing/claims`   | —     | `<ClaimsWidget />`   |
| `ar`       | Outstanding (AR)    | `/billing/ar`       | —     | `<ArWidget />`       |

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
