import type { ModuleManifest } from '../types';

export const receptionManifest: ModuleManifest = {
  "id": "reception",
  "title": "Reception / OPD",
  "category": "clinical",
  "icon": "Re",
  "requiredRoles": [
    "ROLE_RECEPTION",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/reception/queue",
  "description": "Live token queue, appointments, registration, AI calling, referrals",
  "tabs": [
    {
      "id": "queue",
      "label": "Live Queue",
      "path": "/reception/queue",
      "badge": "14"
    },
    {
      "id": "appointments",
      "label": "Appointments",
      "path": "/reception/appointments"
    },
    {
      "id": "schedule",
      "label": "Day Schedule",
      "path": "/reception/schedule"
    },
    {
      "id": "registration",
      "label": "Registration",
      "path": "/reception/registration"
    },
    {
      "id": "admission",
      "label": "Admission",
      "path": "/reception/admission"
    },
    {
      "id": "aicalling",
      "label": "AI Calling",
      "path": "/reception/aicalling"
    },
    {
      "id": "whatsapp",
      "label": "WhatsApp Assistant",
      "path": "/reception/whatsapp"
    },
    {
      "id": "referrals",
      "label": "Referrals",
      "path": "/reception/referrals"
    }
  ]
};

export const manifest = receptionManifest;
