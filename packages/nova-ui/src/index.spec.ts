import { describe, expect, it } from 'vitest';
import * as nova from './index';
import type {
  AppShellProps,
  CardProps,
  HeroBandProps,
  KpiTileProps,
  NavItemProps,
  SearchFieldProps,
  SidebarProps,
  TabListProps,
  TabPanelProps,
  TabProps,
  TabsProps,
  TopBarProps,
} from './index';

// Types vanish at runtime, so the check is that this file compiles: typecheck fails the moment the
// barrel stops exporting one of these prop types.
type ShellPropTypes =
  | AppShellProps
  | NavItemProps
  | SearchFieldProps
  | SidebarProps
  | TabListProps
  | TabPanelProps
  | TabProps
  | TabsProps
  | TopBarProps;

describe('@hos/nova-ui public API', () => {
  it.each([
    'AppShell',
    'Button',
    'Chip',
    'Card',
    'CardHeader',
    'CardBody',
    'HeroBand',
    'KpiTile',
    'NavItem',
    'SearchField',
    'Sidebar',
    'Tab',
    'TabList',
    'TabPanel',
    'Tabs',
    'TopBar',
    'NovaThemeProvider',
    'applyNovaTheme',
    'createNovaTheme',
    'NovaThemeError',
    'contrastRatio',
    'isHexColour',
    'primitives',
    'NOVA_DEFAULTS',
    'cx',
    'focusRing',
    'Surface',
    'SURFACE_MATERIALS',
    'useControllableState',
    'VisuallyHidden',
  ])('exports %s from the barrel', (name) => {
    expect(nova).toHaveProperty(name);
  });

  it('keeps the Storybook-only example themes out of the barrel', () => {
    expect(nova).not.toHaveProperty('EXAMPLE_THEMES');
  });

  it('exports the prop types of the components (checked by tsc, types are erased at runtime)', () => {
    const card: CardProps = { variant: 'data' };
    const hero: HeroBandProps = { title: 'Today', headingLevel: 2 };
    const kpi: KpiTileProps = {
      label: 'Beds free',
      value: 14,
      trend: 'flat',
      tone: 'good',
    };
    expect([card, hero, kpi]).toHaveLength(3);
  });

  it('exports the prop types of the shell components', () => {
    const none: ShellPropTypes[] = [];
    expect(none).toEqual([]);
  });

  it('keeps the Tabs context internal', () => {
    expect(nova).not.toHaveProperty('TabsContext');
  });
});
