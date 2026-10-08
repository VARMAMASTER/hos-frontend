import type { ModuleManifest } from '../types';

export const nursingManifest: ModuleManifest = {
  "id": "nursing",
  "title": "Ward Nursing",
  "category": "clinical",
  "icon": "Nu",
  "requiredRoles": [
    "ROLE_NURSE"
  ],
  "defaultPath": "/nursing/patients",
  "description": "My patients, SBAR shift handover, medication round eMAR, ward stock, voice vitals, assessments",
  "tabs": [
    {
      "id": "patients",
      "label": "My Patients",
      "path": "/nursing/patients",
      "badge": "8"
    },
    {
      "id": "handover",
      "label": "Shift Handover",
      "path": "/nursing/handover"
    },
    {
      "id": "meds",
      "label": "Medication Round",
      "path": "/nursing/meds"
    },
    {
      "id": "stock",
      "label": "Ward Stock",
      "path": "/nursing/stock"
    },
    {
      "id": "vitals",
      "label": "Vitals & Charting",
      "path": "/nursing/vitals"
    },
    {
      "id": "assessments",
      "label": "Assessments",
      "path": "/nursing/assessments"
    },
    {
      "id": "careplans",
      "label": "Care Plans",
      "path": "/nursing/careplans"
    }
  ]
};

export const manifest = nursingManifest;
