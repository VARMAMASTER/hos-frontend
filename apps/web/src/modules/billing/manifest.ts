import type { ModuleManifest } from '../types';

export const billingManifest: ModuleManifest = {
  "id": "billing",
  "title": "Billing & Cashier",
  "category": "financial",
  "icon": "Bi",
  "requiredRoles": [
    "ROLE_BILLING",
    "ROLE_ACCOUNTANT",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/billing/composer",
  "description": "Bill composer, AI line items, advances & packages, GST invoices, claims & pre-auth, AR",
  "tabs": [
    {
      "id": "composer",
      "label": "Bill Composer",
      "path": "/billing/composer"
    },
    {
      "id": "advances",
      "label": "Advances & Packages",
      "path": "/billing/advances"
    },
    {
      "id": "gst",
      "label": "GST Invoices",
      "path": "/billing/gst"
    },
    {
      "id": "claims",
      "label": "Claims & Pre-auth",
      "path": "/billing/claims"
    },
    {
      "id": "ar",
      "label": "Outstanding (AR)",
      "path": "/billing/ar"
    }
  ]
};

export const manifest = billingManifest;
