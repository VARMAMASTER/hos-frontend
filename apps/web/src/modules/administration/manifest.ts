import type { ModuleManifest } from '../types';

export const administrationManifest: ModuleManifest = {
  "id": "administration",
  "title": "Administration",
  "category": "settings",
  "icon": "Ad",
  "requiredRoles": [
    "ROLE_ADMIN",
    "ROLE_OWNER"
  ],
  "defaultPath": "/administration/overview",
  "description": "Hospital profile, departments, staff & roles, tariff master, GST & templates, AI ethics committee, audit log",
  "tabs": [
    {
      "id": "overview",
      "label": "Overview",
      "path": "/administration/overview"
    },
    {
      "id": "departments",
      "label": "Departments",
      "path": "/administration/departments"
    },
    {
      "id": "staff",
      "label": "Staff & Roles",
      "path": "/administration/staff"
    },
    {
      "id": "tariff",
      "label": "Tariff Master",
      "path": "/administration/tariff"
    },
    {
      "id": "gst",
      "label": "GST & Templates",
      "path": "/administration/gst"
    },
    {
      "id": "aiquality",
      "label": "AI Quality & Ethics",
      "path": "/administration/aiquality"
    },
    {
      "id": "compliance",
      "label": "Compliance & NABH",
      "path": "/administration/compliance"
    },
    {
      "id": "training",
      "label": "Training Sandbox",
      "path": "/administration/training"
    },
    {
      "id": "audit",
      "label": "Audit Log",
      "path": "/administration/audit"
    }
  ]
};

export const manifest = administrationManifest;
