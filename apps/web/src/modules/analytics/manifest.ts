import type { ModuleManifest } from '../types';

export const analyticsManifest: ModuleManifest = {
  "id": "analytics",
  "title": "Analytics & Insights",
  "category": "intelligence",
  "icon": "An",
  "requiredRoles": [
    "ROLE_OWNER",
    "ROLE_ADMIN"
  ],
  "defaultPath": "/analytics/ask",
  "description": "Ask anything NL queries, return on HOS, census occupancy trend, revenue leaderboard",
  "tabs": [
    {
      "id": "ask",
      "label": "Ask Anything",
      "path": "/analytics/ask"
    },
    {
      "id": "roi",
      "label": "Return on HOS",
      "path": "/analytics/roi"
    },
    {
      "id": "census",
      "label": "Census & Occupancy",
      "path": "/analytics/census"
    },
    {
      "id": "revenue",
      "label": "Revenue Trends",
      "path": "/analytics/revenue"
    }
  ]
};

export const manifest = analyticsManifest;
