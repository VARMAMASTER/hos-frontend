import type { ModuleManifest } from '../types';

export const pharmacyManifest: ModuleManifest = {
  "id": "pharmacy",
  "title": "Pharmacy & Dispense",
  "category": "financial",
  "icon": "Ph",
  "requiredRoles": [
    "ROLE_PHARMACIST",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/pharmacy/dispense",
  "description": "Dispense queue, counter sale, stock & batches, FEFO expiry, registers, purchase & GRN",
  "tabs": [
    {
      "id": "dispense",
      "label": "Dispense Queue",
      "path": "/pharmacy/dispense",
      "badge": "11"
    },
    {
      "id": "counter",
      "label": "Counter Sale",
      "path": "/pharmacy/counter"
    },
    {
      "id": "stock",
      "label": "Stock & Batches",
      "path": "/pharmacy/stock"
    },
    {
      "id": "fillrate",
      "label": "Fill Rate & Lost Sales",
      "path": "/pharmacy/fillrate"
    },
    {
      "id": "expiry",
      "label": "Expiry & FEFO",
      "path": "/pharmacy/expiry"
    },
    {
      "id": "stores",
      "label": "Stores & Transfers",
      "path": "/pharmacy/stores"
    },
    {
      "id": "count",
      "label": "Count & Variance",
      "path": "/pharmacy/count"
    },
    {
      "id": "registers",
      "label": "Statutory Registers",
      "path": "/pharmacy/registers"
    },
    {
      "id": "forecast",
      "label": "Demand Forecast",
      "path": "/pharmacy/forecast"
    },
    {
      "id": "purchase",
      "label": "Purchase & GRN",
      "path": "/pharmacy/purchase"
    },
    {
      "id": "master",
      "label": "Drug Master",
      "path": "/pharmacy/master"
    }
  ]
};

export const manifest = pharmacyManifest;
