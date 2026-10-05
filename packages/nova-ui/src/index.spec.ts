import { describe, expect, it } from 'vitest';
import * as nova from './index';
import type {
  AreaChartProps,
  BarChartProps,
  CardProps,
  ChartConfig,
  DonutChartProps,
  HeroBandProps,
  KpiTileProps,
  LineChartProps,
  SparklineProps,
} from './index';

describe('@hos/nova-ui public API', () => {
  it.each([
    'Button',
    'Chip',
    'Card',
    'CardHeader',
    'CardBody',
    'HeroBand',
    'KpiTile',
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
