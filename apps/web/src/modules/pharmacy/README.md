# Pharmacy & Dispense (`pharmacy`)

**Category:** `financial`  
**Icon:** `Ph`  
**Default Path:** `/pharmacy/dispense`  
**Required Roles:** `ROLE_PHARMACIST, ROLE_ADMIN`

## Description

Dispense queue, counter sale, stock & batches, FEFO expiry, registers, purchase & GRN

## Tab Catalog

| Tab ID      | Label                  | Route Path            | Badge | Widget Component      |
| ----------- | ---------------------- | --------------------- | ----- | --------------------- |
| `dispense`  | Dispense Queue         | `/pharmacy/dispense`  | `11`  | `<DispenseWidget />`  |
| `counter`   | Counter Sale           | `/pharmacy/counter`   | —     | `<CounterWidget />`   |
| `stock`     | Stock & Batches        | `/pharmacy/stock`     | —     | `<StockWidget />`     |
| `fillrate`  | Fill Rate & Lost Sales | `/pharmacy/fillrate`  | —     | `<FillrateWidget />`  |
| `expiry`    | Expiry & FEFO          | `/pharmacy/expiry`    | —     | `<ExpiryWidget />`    |
| `stores`    | Stores & Transfers     | `/pharmacy/stores`    | —     | `<StoresWidget />`    |
| `count`     | Count & Variance       | `/pharmacy/count`     | —     | `<CountWidget />`     |
| `registers` | Statutory Registers    | `/pharmacy/registers` | —     | `<RegistersWidget />` |
| `forecast`  | Demand Forecast        | `/pharmacy/forecast`  | —     | `<ForecastWidget />`  |
| `purchase`  | Purchase & GRN         | `/pharmacy/purchase`  | —     | `<PurchaseWidget />`  |
| `master`    | Drug Master            | `/pharmacy/master`    | —     | `<MasterWidget />`    |

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
