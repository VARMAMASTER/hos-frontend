import { SURFACE } from './chart-shared';

// The hospital charts keep Nova's four colour families apart. Series take the data palette; a status
// colour appears only on a threshold or a breach marker; a reference that is not a judgement (a
// target, a normal range, now) is ink. AI is never a chart colour.
export const WARN = 'var(--nova-color-warn)';
export const CRIT = 'var(--nova-color-crit)';
// The prototype's .target-line: --ink-3, 1.2px, dashed 4 4.
export const TARGET = 'var(--nova-color-ink-3)';
export const TARGET_DASH = '4 4';
export const TARGET_WIDTH = 1.2;
// A shaded reference range (a normal range): a light ink wash, the same in every series.
export const BAND = 'var(--nova-color-ink-3)';
export const BAND_OPACITY = 0.1;
// Now, and a capacity line: quiet ink, solid.
export const RULE = 'var(--nova-color-ink-2)';
// A track behind a bar (a funnel, a bullet chart): one step off the surface.
export const TRACK = 'var(--nova-color-surface-2)';
// The gauge's track is a thick arc with nothing around it, so it takes the hairline colour to show.
export const GAUGE_TRACK = 'var(--nova-color-border)';
// A target tick across a bar or an arc: full ink, so it holds 3:1 on the track and on the series.
export const TICK = 'var(--nova-color-ink)';

export type Goal = 'at-least' | 'at-most';

// A miss is the wrong side of the target for the goal; the marker points the way it went.
export function missed(value: number, target: number, goal: Goal): boolean {
  return goal === 'at-least' ? value < target : value > target;
}

export type StatusLevel = 'warn' | 'crit';

export const STATUS_COLOUR: Record<StatusLevel, string> = {
  warn: WARN,
  crit: CRIT,
};

export const STATUS_WORD: Record<StatusLevel, string> = {
  warn: 'warning',
  crit: 'critical',
};

// A figure is a finite number; null, undefined, NaN and strings are a missing reading.
export function isReading(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function reading(value: unknown): number | null {
  return isReading(value) ? value : null;
}

// Joins the parts of a sentence or caption that are present (classes are merged with cx instead).
export function joinWords(
  parts: ReadonlyArray<string | number | null | undefined | false>,
  separator = ' ',
): string {
  return parts
    .filter(
      (part): part is string | number =>
        part !== null && part !== undefined && part !== false && part !== '',
    )
    .join(separator);
}

// The smallest readable figure (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 x 10^n) at or above a value,
// for an axis top with headroom that never nearly doubles the plot.
const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const;

export function niceCeiling(value: number): number {
  if (!(value > 0)) {
    return 1;
  }
  const power = 10 ** Math.floor(Math.log10(value));
  const step = NICE_STEPS.find((m) => m * power >= value) ?? 10;
  return Math.round(step * power * 1e6) / 1e6;
}

export type MarkerShape = 'triangle-up' | 'triangle-down' | 'diamond';

function markerPoints(shape: MarkerShape, cx: number, cy: number, r: number) {
  switch (shape) {
    case 'triangle-up':
      return `${cx},${cy - r} ${cx + r},${cy + r * 0.8} ${cx - r},${cy + r * 0.8}`;
    case 'triangle-down':
      return `${cx - r},${cy - r * 0.8} ${cx + r},${cy - r * 0.8} ${cx},${cy + r}`;
    default:
      return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  }
}

// A breach marker: its shape tells the reading (up for high, down for low, a diamond for over a
// limit), its status colour only repeats it, and a ring in the surface colour keeps it legible on a
// line.
export function Marker({
  shape,
  cx,
  cy,
  colour,
  size = 6,
  ...data
}: {
  shape: MarkerShape;
  cx: number;
  cy: number;
  colour: string;
  size?: number;
} & Record<`data-${string}`, string>) {
  return (
    <polygon
      {...data}
      data-shape={shape}
      points={markerPoints(shape, cx, cy, size)}
      fill={colour}
      stroke={SURFACE}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );
}

// The coordinates Recharts hands a custom dot, which may be missing for a null reading.
export interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  value?: unknown;
  payload?: Record<string, unknown>;
}

// The heatmap's sequential scale: five steps of one palette hue mixed into the surface. One hue
// whose strength rises step by step reads for every colour vision (it is a lightness ramp, not a hue
// ramp), and because it is mixed into the scheme's own surface it runs pale to strong in light and
// dark to bright in dark. A missing value is not a step: it is an empty outlined cell.
export const HEAT_STEPS = 5;
const HEAT_STRENGTH = [14, 32, 52, 74, 100] as const;

export function heatLevel(value: number, max: number): number {
  if (!(max > 0) || !(value > 0)) {
    return 0;
  }
  return Math.min(HEAT_STEPS - 1, Math.floor((value / max) * HEAT_STEPS));
}

export function heatFill(colour: string, level: number): string {
  const strength =
    HEAT_STRENGTH[Math.max(0, Math.min(HEAT_STEPS - 1, level))] ?? 100;
  return `color-mix(in oklab, ${colour} ${strength}%, var(--nova-color-surface))`;
}

// A breach marker as a ReferenceDot shape: Recharts hands over the point, the marker is drawn on it.
export function markerShape(
  shape: MarkerShape,
  colour: string,
  data: Record<`data-${string}`, string>,
) {
  return function ReferenceMarker(props: DotProps) {
    if (!hasPoint(props)) {
      return <g />;
    }
    return (
      <Marker
        {...data}
        shape={shape}
        cx={props.cx}
        cy={props.cy}
        colour={colour}
      />
    );
  };
}

// A signed change: +2, −3 (a true minus sign), 0.
export function signed(value: number, format: (n: number) => string): string {
  if (value > 0) {
    return `+${format(value)}`;
  }
  if (value < 0) {
    return `−${format(-value)}`;
  }
  return format(0);
}

export function hasPoint(
  props: DotProps,
): props is DotProps & { cx: number; cy: number } {
  return isReading(props.cx) && isReading(props.cy);
}
