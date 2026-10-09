# AI Workforce Fleet (`ai-workforce`)

**Category:** `intelligence`  
**Icon:** the AI mark (`AiMark`)  
**Default Path:** `/ai-workforce/overview`  
**Required Roles:** `ROLE_OWNER, ROLE_ADMIN`

## Description

5-worker summary feed, WhatsApp agent, Voice agent, Scribe agent, Billing agent, Discharge & Lab agent

## Tab Catalog

| Tab ID          | Label              | Route Path                    | Badge | Widget Component         |
| --------------- | ------------------ | ----------------------------- | ----- | ------------------------ |
| `overview`      | Overview           | `/ai-workforce/overview`      | —     | `<OverviewWidget />`     |
| `whatsapp`      | WhatsApp Assistant | `/ai-workforce/whatsapp`      | —     | `<WhatsappWidget />`     |
| `voice`         | Voice Assistant    | `/ai-workforce/voice`         | —     | `<VoiceWidget />`        |
| `scribe`        | AI Scribe          | `/ai-workforce/scribe`        | —     | `<ScribeWidget />`       |
| `billing`       | Billing Agent      | `/ai-workforce/billing`       | —     | `<BillingWidget />`      |
| `discharge-lab` | Discharge & Lab    | `/ai-workforce/discharge-lab` | —     | `<DischargeLabWidget />` |

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
