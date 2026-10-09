// Components that do the same job agree, checked in one place: the same control height and padding,
// the same corner for the same kind of surface, the same focus ring and disabled treatment, the same
// words for sizes and tones, and the same prop names. A component that deliberately differs is in an
// allowlist below, with the reason. Heights, paddings and corners are resolved from the compiled
// token layer (test/token-css.ts), so they are the values a browser would draw.
import { cleanup, render } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ActivityFeed } from './components/activity-feed/activity-feed';
import { AiButton } from './components/ai-button/ai-button';
import { AiPanel } from './components/ai-panel/ai-panel';
import { Button } from './components/button/button';
import {
  ButtonGroup,
  ButtonGroupItem,
} from './components/button-group/button-group';
import { Card } from './components/card/card';
import { Checkbox } from './components/checkbox/checkbox';
import { ChoiceCard } from './components/choice-card/choice-card';
import { Dialog } from './components/dialog/dialog';
import { FilterChip } from './components/filter-chip/filter-chip';
import { KpiTile } from './components/kpi-tile/kpi-tile';
import { Menu, MenuItem } from './components/menu/menu';
import { SearchField } from './components/search-field/search-field';
import { Select } from './components/select/select';
import { StatGauge } from './components/stat-gauge/stat-gauge';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from './components/table/table';
import { Tab, TabList, Tabs } from './components/tabs/tabs';
import { TextField } from './components/text-field/text-field';
import { Textarea } from './components/textarea/textarea';
import * as nova from './index';
import { computed, rootTokens, resolve } from './test/token-css';

afterEach(() => cleanup());

const mount = (ui: ReactElement): HTMLElement => render(ui).container;
function one(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`no ${selector}`);
  return element;
}
const token = (name: string) => resolve(`var(${name})`, rootTokens);

// ---------------------------------------------------------------------------------------------------
// Control height and padding
// ---------------------------------------------------------------------------------------------------

type ControlSize = 'sm' | 'md';
interface Control {
  name: string;
  size: ControlSize;
  element: () => HTMLElement;
  // A field pads by the field inset, a pressable control by the control padding.
  kind: 'pressable' | 'field';
}

const CONTROLS: Control[] = [
  ...(['sm', 'md'] as const).flatMap((size): Control[] => [
    {
      name: 'Button',
      size,
      kind: 'pressable',
      element: () => one(mount(<Button size={size}>Save</Button>), 'button'),
    },
    {
      name: 'ButtonGroupItem',
      size,
      kind: 'pressable',
      element: () =>
        one(
          mount(
            <ButtonGroup aria-label="View" size={size}>
              <ButtonGroupItem value="list">List</ButtonGroupItem>
            </ButtonGroup>,
          ),
          'button',
        ),
    },
  ]),

  {
    name: 'FilterChip',
    size: 'sm',
    kind: 'pressable',
    element: () => one(mount(<FilterChip>ICU</FilterChip>), 'button'),
  },
  {
    name: 'TextField',
    size: 'md',
    kind: 'field',
    element: () => one(mount(<TextField label="Ward" />), 'input'),
  },
  {
    name: 'Select',
    size: 'md',
    kind: 'field',
    element: () =>
      one(
        mount(
          <Select label="Ward" options={[{ value: 'icu', label: 'ICU' }]} />,
        ),
        'select',
      ),
  },
  {
    name: 'SearchField',
    size: 'md',
    kind: 'field',
    element: () => one(mount(<SearchField label="Find a patient" />), 'input'),
  },
];

// Controls that deliberately do not take the shared height, and why. Each is still checked below
// for what it does share.
const HEIGHT_EXCEPTIONS: Record<string, string> = {
  'AiButton md':
    'a 44px touch target (min-h-touch): the AI action is a primary tap target on a ward tablet',
  'Tab md':
    'borderless, inside the tab rail (nova-tabbar, p-s2): the rail, not the tab, lines up with a 38px control',
  'Textarea md':
    'grows with its lines: its own least height (min-h-textarea), on the control padding and field inset',
};

function controlHeight(element: HTMLElement): string {
  const read = (property: string) => {
    try {
      return computed(element, property);
    } catch {
      return undefined;
    }
  };
  const height = read('min-height') ?? read('height');
  if (height === undefined) {
    throw new Error(`no height or min-height on ${element.className}`);
  }
  return height;
}

describe('control height and padding', () => {
  const heights = {
    sm: token('--nova-control-h-sm'),
    md: token('--nova-control-h-md'),
  };

  it('resolves the two shared control heights', () => {
    expect(heights).toEqual({ sm: '32.6px', md: '38.15px' });
  });

  it.each(
    CONTROLS.map(
      (control) => [`${control.name} ${control.size}`, control] as const,
    ),
  )('%s is the shared control height', (_, control) => {
    expect(controlHeight(control.element())).toBe(heights[control.size]);
  });

  it.each(
    CONTROLS.filter((control) => control.kind === 'pressable').map(
      (control) => [`${control.name} ${control.size}`, control] as const,
    ),
  )('%s pads and sets its label like a Button of its size', (_, control) => {
    const element = control.element();
    const button = one(
      mount(<Button size={control.size}>Save</Button>),
      'button',
    );
    for (const property of ['padding-inline', 'padding-block', 'font-size']) {
      expect(computed(element, property), property).toBe(
        computed(button, property),
      );
    }
  });

  it.each(
    CONTROLS.filter((control) => control.kind === 'field').map(
      (control) => [control.name, control] as const,
    ),
  )('%s starts its text at the field inset', (_, control) => {
    expect(computed(control.element(), 'padding-left')).toBe(
      token('--nova-field-px'),
    );
  });

  it('lists every exception with a reason, and checks what the exceptions still share', () => {
    expect(Object.keys(HEIGHT_EXCEPTIONS).sort()).toEqual(
      ['AiButton md', 'Tab md', 'Textarea md'].sort(),
    );
    const aiButton = one(mount(<AiButton>Draft</AiButton>), 'button');
    expect(controlHeight(aiButton)).toBe(token('--nova-touch'));
    const button = one(mount(<Button>Save</Button>), 'button');
    const tab = one(
      mount(
        <Tabs defaultValue="a">
          <TabList aria-label="Sections">
            <Tab value="a">Overview</Tab>
          </TabList>
        </Tabs>,
      ),
      '[role="tab"]',
    );
    const textarea = one(mount(<Textarea label="Notes" />), 'textarea');
    for (const property of ['padding-inline', 'padding-block', 'font-size']) {
      expect(computed(tab, property), `Tab ${property}`).toBe(
        computed(button, property),
      );
    }
    expect(computed(aiButton, 'font-size'), 'AiButton font-size').toBe('14px');
    expect(computed(textarea, 'padding-block')).toBe(
      computed(button, 'padding-block'),
    );
    expect(computed(textarea, 'padding-inline')).toBe(token('--nova-field-px'));
    expect(computed(textarea, 'min-height')).toBe(
      token('--nova-textarea-min-h'),
    );
  });
});

// ---------------------------------------------------------------------------------------------------
// Radius by role
// ---------------------------------------------------------------------------------------------------

const corner = (element: HTMLElement) => computed(element, 'border-radius');

describe('the corner of each kind of surface', () => {
  const roles = {
    control: token('--nova-radius-control'),
    card: token('--nova-radius-card'),
    overlay: token('--nova-radius-overlay'),
    full: token('--nova-radius-full'),
  };

  it('AiButton takes the full pill corner', () => {
    expect(corner(one(mount(<AiButton>Draft</AiButton>), 'button'))).toBe(
      roles.full,
    );
  });

  it.each([
    ['Button', () => one(mount(<Button>Save</Button>), 'button')],
    [
      'ButtonGroupItem (unselected)',
      () =>
        one(
          mount(
            <ButtonGroup aria-label="View" defaultValue="grid">
              <ButtonGroupItem value="list">List</ButtonGroupItem>
              <ButtonGroupItem value="grid">Grid</ButtonGroupItem>
            </ButtonGroup>,
          ),
          '[data-value="list"]',
        ),
    ],
    [
      'FilterChip (off)',
      () => one(mount(<FilterChip>ICU</FilterChip>), 'button'),
    ],
    ['TextField', () => one(mount(<TextField label="Ward" />), 'input')],
    [
      'Select',
      () =>
        one(
          mount(
            <Select label="Ward" options={[{ value: 'icu', label: 'ICU' }]} />,
          ),
          'select',
        ),
    ],
    ['SearchField', () => one(mount(<SearchField label="Find" />), 'input')],
    ['Textarea', () => one(mount(<Textarea label="Notes" />), 'textarea')],
    [
      'Tab',
      () =>
        one(
          mount(
            <Tabs defaultValue="a">
              <TabList aria-label="Sections">
                <Tab value="a">Overview</Tab>
              </TabList>
            </Tabs>,
          ),
          '[role="tab"]',
        ),
    ],
    ['Checkbox', () => one(mount(<Checkbox label="Isolation" />), 'input')],
    [
      'MenuItem',
      () => {
        mount(
          <Menu trigger={<Button>Actions</Button>} defaultOpen>
            <MenuItem>Discharge</MenuItem>
          </Menu>,
        );
        return one(document, '[role="menuitem"]');
      },
    ],
  ] as const)('%s takes the control corner', (_, element) => {
    expect(corner(element())).toBe(roles.control);
  });

  it.each([
    ['Card', () => one(mount(<Card>Ramesh</Card>), '[data-surface]')],
    [
      'KpiTile',
      () =>
        one(mount(<KpiTile label="Beds free" value={14} />), '[data-surface]'),
    ],
    [
      'Table',
      () =>
        one(
          mount(
            <Table caption="Labs">
              <TableBody>
                <TableRow>
                  <TableCell>Hb</TableCell>
                </TableRow>
              </TableBody>
            </Table>,
          ),
          '[data-surface]',
        ),
    ],
    [
      'ActivityFeed',
      () =>
        one(
          mount(
            <ActivityFeed
              items={[{ id: 'a', time: 'now', title: 'Admitted' }]}
            />,
          ),
          '[data-surface]',
        ),
    ],
    [
      'StatGauge',
      () =>
        one(
          mount(<StatGauge label="Occupancy" value={72} />),
          '[data-surface]',
        ),
    ],
    [
      'AiPanel',
      () =>
        one(mount(<AiPanel title="Summary">Body</AiPanel>), '[data-surface]'),
    ],
    [
      'ChoiceCard',
      () =>
        one(
          mount(<ChoiceCard type="checkbox" title="Isolation bed" />),
          '[data-surface]',
        ),
    ],
  ] as const)('%s takes the card corner', (_, element) => {
    expect(corner(element())).toBe(roles.card);
  });

  it.each([
    [
      'Menu',
      () => {
        mount(
          <Menu trigger={<Button>Actions</Button>} defaultOpen>
            <MenuItem>Discharge</MenuItem>
          </Menu>,
        );
        const menu = one(document, '[role="menu"]');
        const panel = menu.closest<HTMLElement>('[data-surface]');
        if (panel === null) throw new Error('the menu has no surface');
        return panel;
      },
    ],
    [
      'Dialog',
      () => {
        mount(<Dialog open onClose={() => undefined} title="Discharge" />);
        return one(document, '[role="dialog"]');
      },
    ],
  ] as const)('%s takes the overlay corner', (_, element) => {
    expect(corner(element())).toBe(roles.overlay);
  });

  // Floating layers the prototype itself draws on the card corner, so they keep it.
  const OVERLAY_EXCEPTIONS: Record<string, string> = {
    Toast: 'the prototype .hos-toast is --r-md (sim.css), the card corner',
    Tooltip:
      'a one-line tip on the 18px overlay corner reads as a pill; it keeps the 12px card corner it has always had',
  };

  it('lists the floating layers that keep the card corner, each with its reason', () => {
    expect(Object.keys(OVERLAY_EXCEPTIONS).sort()).toEqual([
      'Toast',
      'Tooltip',
    ]);
    const sources = ['toast/toast.tsx', 'tooltip/tooltip.tsx'].map((path) =>
      readFileSync(join(componentsDir, path), 'utf8'),
    );
    for (const source of sources) {
      expect(source).toMatch(/rounded-card|radius="card"/);
      expect(source).not.toMatch(/rounded-overlay|radius="overlay"/);
    }
  });
});

// ---------------------------------------------------------------------------------------------------
// Static scans of the component sources
// ---------------------------------------------------------------------------------------------------

const srcDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(srcDir, 'components');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.(spec|stories)\.tsx?$/.test(name)
      ? [path]
      : [];
  });
}

const stripComments = (text: string) =>
  text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const files = sources(componentsDir).map((path) => ({
  path: relative(componentsDir, path).replace(/\\/g, '/'),
  text: stripComments(readFileSync(path, 'utf8')),
}));

// The opening tag that starts at `start`: up to its closing > at brace depth 0.
function openingTag(text: string, start: number): string {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0 && text[i - 1] !== '=') {
      return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

// Names in a file whose definition (a const, or a function's body) uses one of `names`: a class
// constant that includes focusRing counts as the focus ring.
function carriers(text: string, names: readonly string[]): Set<string> {
  const found = new Set(names);
  const definitions = [
    ...text.matchAll(/\bconst (\w+)\s*(?::[^=]+)?=([\s\S]*?);\n/g),
    ...text.matchAll(/\bfunction (\w+)\(([\s\S]*?)\n\}/g),
  ];
  for (let pass = 0; pass < 3; pass++) {
    for (const [, name = '', body = ''] of definitions) {
      if ([...found].some((known) => new RegExp(`\\b${known}\\b`).test(body))) {
        found.add(name);
      }
    }
  }
  return found;
}

// Elements a keyboard can reach and act on.
const INTERACTIVE =
  /<(?:button|a|input|select|textarea|summary)\b|<[A-Za-z]+\b(?=[^>]*\brole="(?:button|tab|menuitem\w*|option|switch|checkbox|radio|link|slider)")/g;

// Interactive elements that draw their focus another way, and why.
const FOCUS_EXCEPTIONS: Record<string, string> = {
  'otp-input/otp-input.tsx':
    'the real input is transparent over the boxes; the focused box draws the ring',
};

describe('state treatments', () => {
  it('finds the component sources it scans', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  // The interactive elements in one source that do not take the ring, and how many it checked.
  function unringed(text: string): { missing: string[]; scanned: number } {
    const missing: string[] = [];
    let scanned = 0;
    const ringed = carriers(text, ['focusRing', 'menuItem']);
    for (const match of text.matchAll(INTERACTIVE)) {
      const tag = openingTag(text, match.index);
      // A container the keyboard moves through (a menu, a log, a dialog panel held at tabIndex -1)
      // or a hidden element is not a control.
      if (
        /aria-hidden="true"|tabIndex=\{-1\}[^>]*role="(?:menu|log|dialog)"/.test(
          tag,
        )
      ) {
        continue;
      }
      scanned++;
      if ([...ringed].some((name) => new RegExp(`\\b${name}\\b`).test(tag))) {
        continue;
      }
      const line = text.slice(0, match.index).split('\n').length;
      missing.push(`${line}: ${tag.replace(/\s+/g, ' ').slice(0, 80)}`);
    }
    return { missing, scanned };
  }

  it('gives every interactive element the shared focus ring (focusRing, or a class built on it)', () => {
    let scanned = 0;
    const missing = files
      .filter((file) => !(file.path in FOCUS_EXCEPTIONS))
      .flatMap((file) => {
        const result = unringed(file.text);
        scanned += result.scanned;
        return result.missing.map((where) => `${file.path}:${where}`);
      });
    expect(missing).toEqual([]);
    expect(scanned).toBeGreaterThan(40);
  });

  it('keeps no stale exception: each listed file still draws its focus another way', () => {
    for (const path of Object.keys(FOCUS_EXCEPTIONS)) {
      const file = files.find((candidate) => candidate.path === path);
      expect(file, path).toBeDefined();
      expect(unringed(file?.text ?? '').missing.length, path).toBeGreaterThan(
        0,
      );
    }
  });

  it('the focus-ring scan catches a control without the ring, and accepts one built on it', () => {
    expect(
      unringed('<button type="button" className="p-s3">Go</button>').missing,
    ).toHaveLength(1);
    expect(
      unringed('<div role="tab" tabIndex={0} className="p-s3" />').missing,
    ).toHaveLength(1);
    expect(
      unringed(
        "const item = cx('p-s3', focusRing);\n<button className={item}>Go</button>",
      ).missing,
    ).toEqual([]);
    expect(
      unringed('<a href="#x" className={cx(link, focusRing)}>x</a>').missing,
    ).toEqual([]);
  });

  // The disabled look is a primitive (primitives/states.ts), so no component writes its own.
  const OWN_DISABLED =
    /(?<![\w-])(?:aria-)?disabled:(?:opacity|pointer-events|cursor)-[\w-]+/g;
  const DISABLED_EXCEPTIONS: Record<string, string> = {
    'rich-text-editor/toolbar.tsx':
      'a toolbar tool keeps its pointer events, so its Tooltip still says why it is unavailable',
    'switch/switch.tsx':
      'the whole row dims (opacity-50 on the label); the input only takes the not-allowed cursor',
    'otp-input/otp-input.tsx':
      'the transparent input over the boxes only takes the not-allowed cursor; the boxes dim',
  };

  it('takes the disabled look from primitives/states.ts, never its own classes', () => {
    const own = files
      .filter((file) => !(file.path in DISABLED_EXCEPTIONS))
      .map((file) => ({
        path: file.path,
        found: [...file.text.matchAll(OWN_DISABLED)].map((match) => match[0]),
      }))
      .filter((file) => file.found.length > 0);
    expect(own).toEqual([]);
    for (const path of Object.keys(DISABLED_EXCEPTIONS)) {
      const file = files.find((candidate) => candidate.path === path);
      expect(
        [...(file?.text ?? '').matchAll(OWN_DISABLED)].length,
        path,
      ).toBeGreaterThan(0);
    }
    expect(OWN_DISABLED.test("'disabled:opacity-40'")).toBe(true);
    OWN_DISABLED.lastIndex = 0;
  });

  it('marks a loading control busy: every component with a loading prop sets aria-busy', () => {
    const silent = files
      .filter((file) => /\bloading\?:/.test(file.text))
      .filter((file) => !/aria-busy/.test(file.text))
      .map((file) => file.path);
    expect(silent).toEqual([]);
    expect(
      files.filter((file) => /\bloading\?:/.test(file.text)).length,
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------------
// One vocabulary for sizes and tones, and one set of prop names
// ---------------------------------------------------------------------------------------------------

const TONE_WORDS = [
  'good',
  'warn',
  'crit',
  'info',
  'neutral',
  'ai',
  'highlight',
  'brand',
];

// The primitives (Spinner, SparkleCluster …) take their sizes and tones from the same vocabulary.
// primitives/types.ts is where the unions are declared, so it is the one file not scanned.
const primitivesDir = join(srcDir, 'primitives');
const primitiveFiles = sources(primitivesDir)
  .filter((path) => relative(primitivesDir, path) !== 'types.ts')
  .map((path) => ({
    path: `primitives/${relative(primitivesDir, path).replace(/\\/g, '/')}`,
    text: stripComments(readFileSync(path, 'utf8')),
  }));

describe('the shared vocabulary (primitives/types.ts)', () => {
  it('scans the primitives as well as the components', () => {
    expect(primitiveFiles.map((file) => file.path)).toContain(
      'primitives/spinner.tsx',
    );
    expect(primitiveFiles.map((file) => file.path)).toContain(
      'primitives/ai-sparkle.tsx',
    );
  });

  // A union of string literals spelled out in a component: two or more tone words, or 'sm' | 'md',
  // is a copy of Tone or Size, which the component should narrow from the shared type instead.
  it('declares no local copy of the Size or Tone unions', () => {
    const copies: string[] = [];
    for (const file of [...files, ...primitiveFiles]) {
      for (const match of file.text.matchAll(/'\w+'(?:\s*\|\s*'\w+')+/g)) {
        // Narrowing the shared type is the point: Extract<Tone, 'good' | 'warn'>.
        const before = file.text.slice(
          Math.max(0, match.index - 40),
          match.index,
        );
        if (/(?:Extract|Exclude)<\s*\w+,\s*$/.test(before)) continue;
        const words = [...match[0].matchAll(/'(\w+)'/g)].map((m) => m[1] ?? '');
        const tones = words.filter((word) => TONE_WORDS.includes(word));
        const size = words.includes('sm') && words.includes('md');
        if (tones.length >= 2 || size) copies.push(`${file.path}: ${match[0]}`);
      }
    }
    expect(copies).toEqual([]);
  });
});

// The exported props interfaces, each with its own prop names.
const propsInterfaces = files.flatMap((file) =>
  [
    ...file.text.matchAll(
      /export interface (\w+Props)\b([^{]*)\{([\s\S]*?)\n\}/g,
    ),
  ].map(([, name = '', heritage = '', body = '']) => ({
    name,
    path: file.path,
    heritage,
    props: [...body.matchAll(/^ {2}(?:readonly )?'?([\w-]+)'?\??:/gm)].map(
      (match) => match[1] ?? '',
    ),
  })),
);

// Prop names Nova never uses, with the word it uses instead.
const SYNONYMS: Record<string, string> = {
  isDisabled: 'disabled',
  kind: 'variant',
  intent: 'tone',
  appearance: 'variant',
  colour: 'tone',
  color: 'tone',
  type: 'variant',
  onValueChanged: 'onValueChange',
};

// Props that look like a synonym but name something else, and why.
const PROP_EXCEPTIONS: Record<string, string> = {
  'RadialGaugeProps.color':
    'a chart palette slot (chart-1 … chart-6), not a status tone',
  'DepartmentHeatmapProps.color':
    'a chart palette slot (chart-1 … chart-6), not a status tone',
  'ChoiceCardProps.type':
    "the input it stands for, 'radio' or 'checkbox', as <input type>; not a visual variant",
};

describe('prop names', () => {
  it('finds the exported props interfaces', () => {
    expect(propsInterfaces.length).toBeGreaterThan(60);
  });

  it('uses no synonym for size, tone, variant, disabled or the change callbacks', () => {
    const found = propsInterfaces.flatMap((entry) =>
      entry.props
        .filter((prop) => prop in SYNONYMS)
        .map((prop) => `${entry.name}.${prop}`)
        .filter((key) => !(key in PROP_EXCEPTIONS))
        .map(
          (key) => `${key} (say ${SYNONYMS[key.split('.')[1] ?? ''] ?? ''})`,
        ),
    );
    expect(found).toEqual([]);
    for (const key of Object.keys(PROP_EXCEPTIONS)) {
      const [name, prop] = key.split('.');
      expect(
        propsInterfaces.some(
          (entry) => entry.name === name && entry.props.includes(prop ?? ''),
        ),
        `${key} is still an exception`,
      ).toBe(true);
    }
  });

  // Controlled and uncontrolled state is <state> / default<State> / on<State>Change everywhere
  // (value, open, checked, pressed, selected), or onChange where the state is the value.
  const STATE_EXCEPTIONS: Record<string, string> = {
    DialogProps:
      'a dialog never opens itself: it asks to close through onClose (Escape, the close button), as the native <dialog> close event, and the parent decides',
  };

  it('names each controlled state, its default and its change callback alike', () => {
    const mismatched: string[] = [];
    for (const entry of propsInterfaces) {
      if (entry.name in STATE_EXCEPTIONS) continue;
      for (const prop of entry.props) {
        const state = /^default([A-Z]\w*)$/.exec(prop)?.[1];
        if (state === undefined) continue;
        const name = state[0]?.toLowerCase() + state.slice(1);
        const callback = `on${state}Change`;
        const ok =
          entry.props.includes(callback) ||
          (name === 'value' && entry.props.includes('onChange'));
        if (!ok)
          mismatched.push(`${entry.name}: default${state} without ${callback}`);
        if (!entry.props.includes(name)) {
          mismatched.push(`${entry.name}: default${state} without ${name}`);
        }
      }
    }
    expect(mismatched).toEqual([]);
  });

  // Every public component takes a className (its own prop, or an element's attributes it extends),
  // merged last through cx on its outermost element.
  it('lets every public component take a className', () => {
    const closed = propsInterfaces
      .filter((entry) => entry.name.replace(/Props$/, '') in nova)
      .filter((entry) => !entry.props.includes('className'))
      .filter(
        (entry) =>
          !/HTMLAttributes|ComponentProps|Props\b|Omit</.test(entry.heritage),
      )
      .map((entry) => `${entry.path}: ${entry.name}`);
    expect(closed).toEqual([]);
  });
});
