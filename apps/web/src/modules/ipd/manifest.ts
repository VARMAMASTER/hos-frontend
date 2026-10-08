import type { ModuleManifest } from '../types';

export const ipdManifest: ModuleManifest = {
  "id": "ipd",
  "title": "Inpatient (IPD)",
  "category": "clinical",
  "icon": "IP",
  "requiredRoles": [
    "ROLE_NURSE",
    "ROLE_DOCTOR",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/ipd/bedboard",
  "description": "60-bed ward board, live ICU vitals, admissions, nursing station, discharge summary",
  "tabs": [
    {
      "id": "bedboard",
      "label": "Bed Board",
      "path": "/ipd/bedboard",
      "badge": "48/60"
    },
    {
      "id": "icu",
      "label": "ICU & Emergency",
      "path": "/ipd/icu"
    },
    {
      "id": "admissions",
      "label": "Admissions",
      "path": "/ipd/admissions"
    },
    {
      "id": "nursing",
      "label": "Nursing Station",
      "path": "/ipd/nursing"
    },
    {
      "id": "discharge",
      "label": "Discharge",
      "path": "/ipd/discharge"
    }
  ]
};

export const manifest = ipdManifest;
