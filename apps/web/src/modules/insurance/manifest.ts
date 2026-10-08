import type { ModuleManifest } from '../types';

export const insuranceManifest: ModuleManifest = {
  "id": "insurance",
  "title": "Insurance & Claims",
  "category": "financial",
  "icon": "In",
  "requiredRoles": [
    "ROLE_INSURANCE_DESK",
    "ROLE_BILLING",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/insurance/eligibility",
  "description": "PM-JAY/TPA eligibility, pre-auth & enhancements, settlement & deductions, reimbursement, ageing",
  "tabs": [
    {
      "id": "eligibility",
      "label": "Eligibility",
      "path": "/insurance/eligibility"
    },
    {
      "id": "preauth",
      "label": "Pre-auth & Enhancement",
      "path": "/insurance/preauth"
    },
    {
      "id": "settlement",
      "label": "Settlement & Deductions",
      "path": "/insurance/settlement"
    },
    {
      "id": "reimbursement",
      "label": "Reimbursement",
      "path": "/insurance/reimbursement"
    },
    {
      "id": "payers",
      "label": "Payers & Contracts",
      "path": "/insurance/payers"
    },
    {
      "id": "ageing",
      "label": "Ageing by Payer",
      "path": "/insurance/ageing"
    }
  ]
};

export const manifest = insuranceManifest;
