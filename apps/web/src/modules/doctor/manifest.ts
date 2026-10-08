import type { ModuleManifest } from '../types';

export const doctorManifest: ModuleManifest = {
  "id": "doctor",
  "title": "Doctor Workspace",
  "category": "clinical",
  "icon": "Dr",
  "requiredRoles": [
    "ROLE_DOCTOR",
    "ROLE_CLINICAL_HEAD"
  ],
  "defaultPath": "/doctor/queue",
  "description": "Queue, consultation scribe, progress notes, orders & Rx, case discussion, AI insights",
  "tabs": [
    {
      "id": "queue",
      "label": "My Queue",
      "path": "/doctor/queue",
      "badge": "26"
    },
    {
      "id": "consult",
      "label": "Consultation",
      "path": "/doctor/consult"
    },
    {
      "id": "notes",
      "label": "Progress Notes",
      "path": "/doctor/notes"
    },
    {
      "id": "orders",
      "label": "Orders & Rx",
      "path": "/doctor/orders"
    },
    {
      "id": "coding",
      "label": "Coding & Claims",
      "path": "/doctor/coding"
    },
    {
      "id": "referrals",
      "label": "Referrals Out",
      "path": "/doctor/referrals"
    },
    {
      "id": "history",
      "label": "Patient History",
      "path": "/doctor/history"
    },
    {
      "id": "discuss",
      "label": "Case Discussion",
      "path": "/doctor/discuss"
    },
    {
      "id": "aiteam",
      "label": "My AI Team",
      "path": "/doctor/aiteam"
    },
    {
      "id": "insights",
      "label": "AI Insights",
      "path": "/doctor/insights"
    }
  ]
};

export const manifest = doctorManifest;
