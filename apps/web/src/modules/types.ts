import type { ReactNode } from 'react';

export type ModuleCategory =
  | 'clinical'
  | 'financial'
  | 'intelligence'
  | 'governance'
  | 'settings'
  | 'platform';

export type ModuleRegistry = ModuleManifest[];

export interface ModuleTab {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

export interface ModuleManifest {
  id: string;
  title: string;
  category: ModuleCategory;
  // The module's tile: its initials, or a node (the AI Workforce's is the AI mark, AiMark).
  icon: ReactNode;
  requiredRoles: string[];
  defaultPath: string;
  tabs: ModuleTab[];
  description: string;
}

export interface ComposableWidgetProps {
  patientId?: string;
  compactMode?: boolean;
  readonly?: boolean;
  className?: string;
}

export interface RouteObject {
  path?: string;
  index?: boolean;
  children?: RouteObject[];
  element?: ReactNode;
}
