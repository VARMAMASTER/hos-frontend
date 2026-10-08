export type ModuleCategory = 'clinical' | 'financial' | 'intelligence' | 'governance' | 'settings' | 'platform';

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
  icon: string;
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
