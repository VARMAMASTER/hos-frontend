import { describe, expect, it } from 'vitest';
import * as nova from './index';
import type {
  AppShellProps,
  AreaChartProps,
  BarChartProps,
  CardProps,
  ChartConfig,
  DonutChartProps,
  HeroBandProps,
  KpiTileProps,
  LineChartProps,
  NavItemProps,
  SearchFieldProps,
  SidebarProps,
  SparklineProps,
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
    'ActivityFeed',
    'BedGrid',
    'BrandMark',
    'Button',
    'Chip',
    'ToneLabel',
    'TONE_WORDS',
    'Card',
    'CardHeader',
    'CardBody',
    'CardFooter',
    'AiBadge',
    'AiPanel',
    'ApprovalBar',
    'Avatar',
    'Breadcrumbs',
    'EmptyState',
    'FilterChip',
    'DataTable',
    'Divider',
    'HeroBand',
    'IconTile',
    'KpiTile',
    'NavItem',
    'SearchField',
    'Sidebar',
    'Tab',
    'TabList',
    'TabPanel',
    'Tabs',
    'TopBar',
    'Pagination',
    'StatusDot',
    'Table',
    'TableBody',
    'TableCell',
    'TableHead',
    'TableHeaderCell',
    'TableRow',
    'Timeline',
    'SectionNav',
    'SplitLayout',
    'Tag',
    'ModuleSwitcher',
    'Banner',
    'Checkbox',
    'Dialog',
    'Menu',
    'MenuItem',
    'MenuItemRadio',
    'MenuGroup',
    'Radio',
    'Select',
    'Switch',
    'TextField',
    'Textarea',
    'Tooltip',
    'AlertDialog',
    'NotificationBell',
    'OtpInput',
    'StatGauge',
    'Toaster',
    'showToast',
    'dismissToast',
    'NovaThemeProvider',
    'applyNovaTheme',
    'createNovaTheme',
    'NovaThemeError',
    'contrastRatio',
    'isHexColour',
    'NOVA_DEFAULTS',
    'cx',
    'focusRing',
    'Surface',
    'SURFACE_MATERIALS',
    'useControllableState',
    'VisuallyHidden',
    'AreaChart',
    'BarChart',
    'ChartContainer',
    'ChartDataTable',
    'ChartLegend',
    'ChartLegendContent',
    'ChartTooltip',
    'ChartTooltipContent',
    'DonutChart',
    'LineChart',
    'NOVA_CHART_PALETTE',
    'Sparkline',
    'chartColorVar',
  ])('exports %s from the barrel', (name) => {
    expect(nova).toHaveProperty(name);
  });

  it('keeps the chart folder own context out of the barrel', () => {
    expect(nova).not.toHaveProperty('ChartContext');
  });

  // Raw hex is for the token layer only; app code takes colour from the semantic tokens.
  it('keeps the raw primitive palette out of the barrel', () => {
    expect(nova).not.toHaveProperty('primitives');
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
  it.each(['FieldShell', 'getTabbables', 'trapTab', 'inertOutside'])(
    'keeps the internal helper %s out of the barrel',
    (name) => {
      expect(nova).not.toHaveProperty(name);
    },
  );
  it('exports the prop types of the charts (checked by tsc)', () => {
    const config: ChartConfig = { beds: { label: 'Beds', color: 'chart-1' } };
    const base = {
      data: [{ ward: 'ICU', beds: 4 }],
      config,
      ariaLabel: 'Beds by ward',
      categoryKey: 'ward',
      seriesKeys: ['beds'],
    };
    const bar: BarChartProps = { ...base, orientation: 'horizontal' };
    const line: LineChartProps = base;
    const area: AreaChartProps = { ...base, stacked: true };
    const spark: SparklineProps = { ...base, seriesKeys: ['beds'] };
    const donut: DonutChartProps = {
      data: [{ payer: 'Cash', n: 1 }],
      config,
      ariaLabel: 'Payer mix',
      categoryKey: 'payer',
      valueKey: 'n',
    };
    expect([bar, line, area, spark, donut]).toHaveLength(5);
  });
});
