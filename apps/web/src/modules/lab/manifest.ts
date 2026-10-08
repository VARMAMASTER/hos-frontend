import type { ModuleManifest } from '../types';

export const labManifest: ModuleManifest = {
  "id": "lab",
  "title": "Laboratory & Diagnostics",
  "category": "financial",
  "icon": "La",
  "requiredRoles": [
    "ROLE_LAB_TECH",
    "ROLE_PATHOLOGIST",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/lab/queue",
  "description": "Order queue, critical results, sample tracking kanban, analyser interface, result entry, TAT",
  "tabs": [
    {
      "id": "queue",
      "label": "Order Queue",
      "path": "/lab/queue",
      "badge": "19"
    },
    {
      "id": "critical",
      "label": "Critical Results",
      "path": "/lab/critical",
      "badge": "2"
    },
    {
      "id": "tracking",
      "label": "Sample Tracking",
      "path": "/lab/tracking"
    },
    {
      "id": "analyzer",
      "label": "Analyser Interface",
      "path": "/lab/analyzer"
    },
    {
      "id": "entry",
      "label": "Result Entry",
      "path": "/lab/entry"
    },
    {
      "id": "tat",
      "label": "TAT Intelligence",
      "path": "/lab/tat"
    },
    {
      "id": "reports",
      "label": "Reports & Delivery",
      "path": "/lab/reports"
    }
  ]
};

export const manifest = labManifest;
