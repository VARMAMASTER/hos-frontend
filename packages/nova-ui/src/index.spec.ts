import { describe, expect, it } from 'vitest';
import * as nova from './index';
import type {
  AppShellProps,
  AreaChartProps,
  BarChartProps,
  CardProps,
  ChartConfig,
  ChartLegendItem,
  ComparisonBarChartProps,
  DepartmentHeatmapProps,
  DonutChartProps,
  FunnelChartProps,
  HeroBandProps,
  KpiTileProps,
  LineChartProps,
  NavItemProps,
  OccupancyAreaChartProps,
  PatientFlowChartProps,
  RadialGaugeProps,
  SearchFieldProps,
  SidebarProps,
  SparklineProps,
  TabListProps,
  TabPanelProps,
  TabProps,
  TabsProps,
  TopBarProps,
  VitalsChartProps,
  VitalsConfig,
  WaitTimeChartProps,
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
    'ButtonGroup',
    'ButtonGroupItem',
    'ChatBubble',
    'Chip',
    'ChoiceCard',
    'ChoiceCardGroup',
    'ToneLabel',
    'TONE_WORDS',
    'CallSystemEvent',
    'CallTranscriptConsole',
    'CallTurn',
    'CallWriteBack',
    'Card',
    'CardHeader',
    'CardBody',
    'CardFooter',
    'AiBadge',
    'AiButton',
    'AiClassChip',
    'AiDraftBlock',
    'AiDraftReply',
    'AiPanel',
    'AiSourceLine',
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
    'NavSection',
    'SearchField',
    'Sidebar',
    'Tab',
    'TabList',
    'TabPanel',
    'Tabs',
    'TopBar',
    'Pagination',
    'StatusDot',
    'LiveDot',
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
    'RichTextEditor',
    'Select',
    'Switch',
    'TextField',
    'Textarea',
    'TierCard',
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
    'PhoneFrame',
    'WaBilingualMessage',
    'WaMessage',
    'WaQuickReplyButtons',
    'WaTypingIndicator',
    'WhatsAppThread',
    'WhyTrail',
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
    'ChartLegendList',
    'VitalsChart',
    'OccupancyAreaChart',
    'PatientFlowChart',
    'WaitTimeChart',
    'DepartmentHeatmap',
    'FunnelChart',
    'RadialGauge',
    'ComparisonBarChart',
    // The scheme axis, the theme engine an admin theme editor builds on, and the motion tokens.
    'NOVA_SCHEMES',
    'NOVA_DEFAULT_SCHEME',
    'isNovaScheme',
    'deriveNovaPalette',
    'suggestNovaBrand',
    'legibilityFailures',
    'MOTION_DURATIONS_MS',
    'MOTION_EASINGS',
  ])('exports %s from the barrel', (name) => {
    expect(nova).toHaveProperty(name);
  });

  it('keeps the chart folder own context out of the barrel', () => {
    expect(nova).not.toHaveProperty('ChartContext');
  });

  it.each([
    'ChartFigure',
    'ChartPlot',
    'Marker',
    'niceCeiling',
    'heatFill',
    'heatLevel',
  ])('keeps the chart folder internal %s out of the barrel', (name) => {
    expect(nova).not.toHaveProperty(name);
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

  it('exports the prop types of the hospital charts (checked by tsc)', () => {
    const vitalsConfig: VitalsConfig = {
      hr: { label: 'Heart rate', unit: 'bpm', normal: { min: 60, max: 100 } },
    };
    const vitals: VitalsChartProps = {
      data: [{ time: '06:00', hr: 72 }],
      config: vitalsConfig,
      ariaLabel: 'Vitals',
      categoryKey: 'time',
      seriesKeys: ['hr'],
      now: '06:00',
    };
    const legend: ChartLegendItem = {
      key: 'normal',
      label: 'Normal range',
      mark: 'band',
      color: 'var(--nova-color-ink-3)',
    };
    const base = {
      data: [{ day: 'Mon', icu: 4, admitted: 2, discharged: 1, p50: 9 }],
      config: { icu: { label: 'ICU' } },
      ariaLabel: 'Hospital',
      categoryKey: 'day',
    };
    const occupancy: OccupancyAreaChartProps = {
      ...base,
      seriesKeys: ['icu'],
      capacity: 6,
    };
    const flow: PatientFlowChartProps = {
      ...base,
      admissionsKey: 'admitted',
      dischargesKey: 'discharged',
    };
    const wait: WaitTimeChartProps = {
      ...base,
      p50Key: 'p50',
      p90Key: 'p90',
      target: 30,
    };
    const heatmap: DepartmentHeatmapProps = {
      data: [{ day: 'Mon', hour: 9, arrivals: 4 }],
      ariaLabel: 'Arrivals',
      rowKey: 'day',
      columnKey: 'hour',
      valueKey: 'arrivals',
    };
    const funnel: FunnelChartProps = { ...base, valueKey: 'icu' };
    const gauge: RadialGaugeProps = {
      ariaLabel: 'Occupancy',
      value: 78,
      target: 85,
      goal: 'at-most',
    };
    const comparison: ComparisonBarChartProps = {
      ...base,
      actualKey: 'icu',
      targetKey: 'p50',
      variant: 'diverging',
    };
    expect([
      vitals,
      legend,
      occupancy,
      flow,
      wait,
      heatmap,
      funnel,
      gauge,
      comparison,
    ]).toHaveLength(9);
  });
});
