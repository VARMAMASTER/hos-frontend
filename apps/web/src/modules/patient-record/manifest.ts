import type { ModuleManifest } from '../types';

export const patientRecordManifest: ModuleManifest = {
  "id": "patient-record",
  "title": "Patient Records",
  "category": "clinical",
  "icon": "Pt",
  "requiredRoles": [
    "ROLE_DOCTOR",
    "ROLE_NURSE",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/patient-record/snapshot",
  "description": "Clinical snapshot, demographics, clinical timeline, document vault, family & consent",
  "tabs": [
    {
      "id": "snapshot",
      "label": "Clinical Snapshot",
      "path": "/patient-record/snapshot"
    },
    {
      "id": "profile",
      "label": "Profile",
      "path": "/patient-record/profile"
    },
    {
      "id": "timeline",
      "label": "Timeline",
      "path": "/patient-record/timeline"
    },
    {
      "id": "documents",
      "label": "Documents",
      "path": "/patient-record/documents"
    },
    {
      "id": "family",
      "label": "Family & Consent",
      "path": "/patient-record/family"
    },
    {
      "id": "patientview",
      "label": "Patient View",
      "path": "/patient-record/patientview"
    }
  ]
};

export const manifest = patientRecordManifest;
