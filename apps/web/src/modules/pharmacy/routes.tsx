import type { RouteObject } from '../types';
import {
  DispenseWidget,
  CounterWidget,
  StockWidget,
  FillrateWidget,
  ExpiryWidget,
  StoresWidget,
  CountWidget,
  RegistersWidget,
  ForecastWidget,
  PurchaseWidget,
  MasterWidget,
} from './tabs';

export const pharmacyRoutes: RouteObject[] = [
  {
    path: '/pharmacy',
    children: [
      {
        index: true,
        element: <DispenseWidget />,
      },
      {
        path: 'dispense',
        element: <DispenseWidget />,
      },
      {
        path: 'counter',
        element: <CounterWidget />,
      },
      {
        path: 'stock',
        element: <StockWidget />,
      },
      {
        path: 'fillrate',
        element: <FillrateWidget />,
      },
      {
        path: 'expiry',
        element: <ExpiryWidget />,
      },
      {
        path: 'stores',
        element: <StoresWidget />,
      },
      {
        path: 'count',
        element: <CountWidget />,
      },
      {
        path: 'registers',
        element: <RegistersWidget />,
      },
      {
        path: 'forecast',
        element: <ForecastWidget />,
      },
      {
        path: 'purchase',
        element: <PurchaseWidget />,
      },
      {
        path: 'master',
        element: <MasterWidget />,
      },
    ],
  },
];

export const routes = pharmacyRoutes;
