import type { RouteObject } from '../types';
import {
  EligibilityWidget,
  PreauthWidget,
  SettlementWidget,
  ReimbursementWidget,
  PayersWidget,
  AgeingWidget,
} from './tabs';

export const insuranceRoutes: RouteObject[] = [
  {
    path: '/insurance',
    children: [
      {
        index: true,
        element: <EligibilityWidget />,
      },
      {
        path: 'eligibility',
        element: <EligibilityWidget />,
      },
      {
        path: 'preauth',
        element: <PreauthWidget />,
      },
      {
        path: 'settlement',
        element: <SettlementWidget />,
      },
      {
        path: 'reimbursement',
        element: <ReimbursementWidget />,
      },
      {
        path: 'payers',
        element: <PayersWidget />,
      },
      {
        path: 'ageing',
        element: <AgeingWidget />,
      },
    ],
  },
];

export const routes = insuranceRoutes;
