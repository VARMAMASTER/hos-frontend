// @vitest-environment node
// Nova's component rules, enforced. Components are composed from tokens and primitives (SOLID:
// each primitive has one job, components depend on them instead of re-implementing them), so a
// change to class merging, the focus ring or a surface happens in one place and reaches all of them.
// The scales are the HOS prototype's (os/public/assets/hos.css), as the design-token layer: every
// design value is a named token ("TOKENS ONLY" below), and the other rules keep colour, material,
// shadow, gradient and weight on their tokens too.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { __unstable__loadDesignSystem, compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import { FONT_WEIGHT_UTILITIES, SHADOW_UTILITIES } from '../tokens/scale';

const componentsDir = fileURLToPath(new URL('../components', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    const isSource =
      /\.tsx?$/.test(name) && !/\.(spec|stories)\.tsx?$/.test(name);
    return isSource ? [path] : [];
  });
}

const files = sourceFiles(componentsDir).map((path) => ({
  path: path.slice(componentsDir.length + 1),
  text: readFileSync(path, 'utf8'),
}));

// Any shadow that is not one of the prototype's: a stock size outside SHADOW_UTILITIES, an arbitrary
// shadow utility, an inset or drop shadow, or a box-shadow declaration (CSS or a style object).
// Naming box-shadow as a property to transition, or setting a surface's lift property to a shadow
// token, is fine.
const SHADOW_NAMES = [...SHADOW_UTILITIES, 'shadow-none']
  .map((name) => name.slice('shadow-'.length))
  .join('|');
const SHADOW_OFFENCE = new RegExp(
  String.raw`(?<![\w-])(?:inset|drop)-shadow|(?<![\w-])shadow(?:-(?!(?:${SHADOW_NAMES})(?![\w-]))|(?=['"\x60\s]))|box-?shadow['"]?\s*:`,
  'i',
);

// A utility class starts a string, follows whitespace, a quote or a variant colon, or opens a group.
const CLASS_START = /(?<=^|[\s'"`:!(])/.source;
const code = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

// A guard reports the utility, without its variant prefix.
function bare(cls: string): string {
  return cls.slice(cls.lastIndexOf(':') + 1);
}

// Weights are the prototype's 400 / 500 / 600 / 700, written as FONT_WEIGHT_UTILITIES.
const WEIGHT_UTILITY = new RegExp(
  CLASS_START +
    /(?:[\w-]+:)*font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[[^\]]*\])(?![\w-])/
      .source,
  'g',
);
const weightOffences = (text: string): string[] => [
  ...[...code(text).matchAll(WEIGHT_UTILITY)]
    .map((match) => match[0])
    .filter(
      (utility) =>
        !(FONT_WEIGHT_UTILITIES as readonly string[]).includes(bare(utility)),
    ),
  ...[...code(text).matchAll(/fontWeight:\s*['"]?(\d+)/g)]
    .map((match) => match[1] ?? '')
    .filter((weight) => !['400', '500', '600', '700'].includes(weight))
    .map((weight) => `fontWeight: ${weight}`),
];

// The components that break a rule, each with the classes that break it.
const offences = (find: (text: string) => string[]) =>
  files
    .map((file) => ({
      path: file.path,
      classes: [...new Set(find(file.text).map(bare))],
    }))
    .filter((file) => file.classes.length > 0);

const offenders = (pattern: RegExp) =>
  files.filter((file) => pattern.test(file.text)).map((file) => file.path);

describe('component conventions', () => {
  it('finds the component sources it polices', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('merges classes with cx, never a hand-rolled filter/join', () => {
    expect(offenders(/\.filter\(Boolean\)\s*\.join\(/)).toEqual([]);
  });

  it('takes the keyboard focus ring from focusRing, never its own outline classes', () => {
    expect(offenders(/focus-visible:outline-/)).toEqual([]);
  });

  it('never writes a raw hex colour — colour comes from semantic tokens', () => {
    expect(offenders(/['"`]#[0-9a-fA-F]{3,8}\b/)).toEqual([]);
  });

  it('never reaches for the stock Tailwind palette', () => {
    expect(
      offenders(
        /\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
      ),
    ).toEqual([]);
  });

  it('never writes a raw colour as a Tailwind arbitrary value or an inline style either', () => {
    expect(
      offenders(
        /\[(?:color:)?(?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\()|style=\{\{[^}]*['"`](?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\()/,
      ),
    ).toEqual([]);
  });

  // Surface is the one way to a material role, so a role's tokens and wiring change in one place.
  // nova-field is the exception: it is applied to the form control element itself.
  it('reaches the surface materials only through Surface, never by writing the utility class', () => {
    const material =
      /(?<=['"`\s])nova-(?:card|surface|overlay|chrome|sidebar|hero|data|ai-block)(?=['"`\s])/;
    expect(
      files
        .filter((file) => material.test(code(file.text)))
        .map((file) => file.path),
    ).toEqual([]);
  });

  it('never forces a border colour with an important modifier — a control sets --nova-field-edge instead', () => {
    expect(offenders(/\bborder-[\w-]+!/)).toEqual([]);
  });

  it('never writes its own backdrop-filter — material comes from the surface utilities', () => {
    expect(offenders(/backdrop-(?:filter|blur)/)).toEqual([]);
  });

  // The prototype draws plain border-radius corners: no corner-shape anywhere.
  it('draws plain rounded corners, never a corner-shape of its own', () => {
    expect(offenders(/corner-shape/)).toEqual([]);
  });

  // Shadows come only from the prototype's --shadow-* tokens (through the surface utilities, or the
  // shadow-sm | md | lg | glass classes); a component never invents a shadow.
  it('casts no shadow of its own: only shadow-sm | md | lg | glass or shadow-none', () => {
    expect(
      files
        .filter((file) => SHADOW_OFFENCE.test(code(file.text)))
        .map((file) => file.path),
    ).toEqual([]);
  });

  it('the shadow guard rejects a stock, arbitrary, inset or drop shadow and accepts the prototype scale', () => {
    for (const bad of [
      "'shadow-xl'",
      "'hover:shadow-2xl'",
      "'shadow-xs'",
      "'shadow-[0_1px_2px_black]'",
      "'shadow'",
      '{ boxShadow: "0 0 4px" }',
      "'inset-shadow-sm'",
      "'drop-shadow-md'",
      "'shadow-elevation-1'",
      "'shadow-glassy'",
    ]) {
      expect(SHADOW_OFFENCE.test(bad), bad).toBe(true);
    }
    for (const good of [
      "'shadow-sm'",
      "'hover:shadow-md'",
      "'shadow-lg'",
      "'shadow-glass'",
      "'shadow-none'",
      "'[--nova-overlay-lift:var(--nova-shadow-lg)]'",
      "'transition-[transform,box-shadow]'",
    ]) {
      expect(SHADOW_OFFENCE.test(good), good).toBe(false);
    }
  });

  // Gradients are restored as the prototype draws them, but they live in theme.css (the AI gradient,
  // the rail, the chrome, the hero and the data edge) and reach a component as a utility or a token.
  const GRADIENT_OFFENCE = /bg-(?:linear|radial|conic|gradient)-|gradient\(/;
  it('never paints a gradient of its own: gradients come from the theme.css tokens and utilities', () => {
    expect(offenders(GRADIENT_OFFENCE)).toEqual([]);
  });

  it('the gradient guard rejects a hand-written gradient and accepts the token utilities', () => {
    for (const bad of [
      "'bg-linear-to-r from-ai to-primary'",
      "'bg-radial-[at_25%_25%]'",
      "'bg-[linear-gradient(90deg,red,blue)]'",
      "{ backgroundImage: 'conic-gradient(red, blue)' }",
    ]) {
      expect(GRADIENT_OFFENCE.test(bad), bad).toBe(true);
    }
    for (const good of [
      "'nova-ai-grad'",
      "'nova-ai-mark'",
      "'[--nova-data-edge:var(--nova-gradient-edge-kpi)]'",
      "'nova-highlight-grad'",
      "'nova-highlight-text'",
      "'[--nova-data-edge:var(--nova-gradient-highlight-edge)]'",
    ]) {
      expect(GRADIENT_OFFENCE.test(good), good).toBe(false);
    }
  });

  // The highlight reaches a component only through its tokens: the colour utilities (bg-highlight,
  // border-highlight, text-highlight-deep, bg-highlight-soft, …), the nova-highlight-* utilities, or
  // the data-edge swap. A component never names a highlight variable itself, never paints the
  // highlight at an opacity (only the solid values are proven), never sets text in the bare
  // highlight (it is a mark: highlight text is the deep ink or nova-highlight-text), and never
  // invents a highlight utility.
  const HIGHLIGHT_UTILITIES: readonly string[] = [
    'nova-highlight-grad',
    'nova-highlight-rail',
    'nova-highlight-wash',
    'nova-highlight-text',
    'nova-highlight-edge',
    'nova-highlight-ring',
  ];
  const HIGHLIGHT_SWAP =
    '[--nova-data-edge:var(--nova-gradient-highlight-edge)]';
  const highlightOffences = (text: string): string[] => {
    const source = code(text).split(HIGHLIGHT_SWAP).join('');
    return [
      ...[...source.matchAll(/--nova-(?:color|gradient)-highlight[\w-]*/g)],
      ...[
        ...source.matchAll(
          /(?<![\w-])[a-z]+(?:-[a-z]+)*-highlight(?:-(?:soft|deep|hover))?\/[\w.[\]()%-]+/g,
        ),
      ],
      ...[...source.matchAll(/(?<![\w-])text-highlight(?![\w-])/g)],
      ...[...source.matchAll(/(?<![\w-])nova-highlight-[\w-]+/g)].filter(
        (match) => !HIGHLIGHT_UTILITIES.includes(match[0]),
      ),
    ].map((match) => bare(match[0]));
  };

  it('reaches the highlight only through its tokens and utilities', () => {
    expect(offences(highlightOffences)).toEqual([]);
  });

  it('the highlight guard rejects a raw variable, an opacity, highlight text and an unknown utility, and accepts the tokens', () => {
    for (const bad of [
      "'bg-[var(--nova-color-highlight)]'",
      "{ color: 'var(--nova-color-highlight-deep)' }",
      "'[background-image:var(--nova-gradient-highlight)]'",
      "'bg-highlight/40'",
      "'hover:border-highlight-hover/50'",
      "'text-highlight'",
      "'md:text-highlight'",
      "'nova-highlight-glow'",
    ]) {
      expect(highlightOffences(bad), bad).not.toEqual([]);
    }
    for (const good of [
      "'bg-highlight-soft text-highlight-deep'",
      "'border border-highlight'",
      "'hover:border-highlight-hover'",
      "'nova-highlight-grad'",
      "'nova-highlight-wash nova-highlight-edge'",
      "'nova-highlight-rail'",
      "'nova-highlight-text'",
      "'nova-highlight-ring'",
      `'${HIGHLIGHT_SWAP}'`,
    ]) {
      expect(highlightOffences(good), good).toEqual([]);
    }
  });
});

// The weights are the prototype's 400 / 500 / 600 / 700 everywhere, stories included.
// The chrome-1..3 colours are the fixed dark indigo of the sidebar and top bar: they do not flip in
// the dark scheme. As a text colour they are dark on a dark surface there (the selected Tab was
// exactly that). Text takes ink, ink-2, ink-3, a status or brand ink, or chrome-ink on the chrome.
const FIXED_CHROME_TEXT = new RegExp(
  CLASS_START + String.raw`(?:[\w-]+:)*text-chrome-[123](?![\w-])`,
  'g',
);

describe('text colours that flip with the scheme', () => {
  it('never sets text to a fixed chrome colour in a component', () => {
    expect(
      files
        .map((file) => ({
          path: file.path,
          found: code(file.text).match(FIXED_CHROME_TEXT) ?? [],
        }))
        .filter((file) => file.found.length > 0),
    ).toEqual([]);
  });

  it('the guard rejects text-chrome-1..3, with or without a variant, and accepts ink and chrome-ink', () => {
    for (const bad of [
      'text-chrome-1',
      'hover:text-chrome-2',
      'md:dark:text-chrome-3',
    ]) {
      expect(`'${bad}'`.match(FIXED_CHROME_TEXT), bad).not.toBeNull();
    }
    for (const good of [
      'text-ink',
      'text-chrome-ink',
      'bg-chrome-1',
      'ring-chrome-1',
      'text-chrome-ink-2',
    ]) {
      expect(`'${good}'`.match(FIXED_CHROME_TEXT), good).toBeNull();
    }
  });
});

describe('the weights', () => {
  const srcDir = fileURLToPath(new URL('..', import.meta.url));
  const everySource = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return everySource(path);
      return /\.tsx?$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
    });

  it('uses only font-normal, font-medium, font-semibold and font-bold in a component, primitive or story', () => {
    expect(
      everySource(srcDir)
        .map((path) => ({
          path: path.slice(srcDir.length),
          weights: [
            ...new Set(weightOffences(readFileSync(path, 'utf8')).map(bare)),
          ],
        }))
        .filter((file) => file.weights.length > 0),
    ).toEqual([]);
  });

  it('the weight guard rejects a weight off the prototype ladder and accepts the four it uses', () => {
    for (const bad of [
      'font-light',
      'font-thin',
      'font-extrabold',
      'font-black',
      'font-[550]',
      'hover:font-extralight',
    ]) {
      expect(weightOffences(`'${bad}'`).map(bare), bad).toEqual([bare(bad)]);
    }
    expect(weightOffences('{ fontWeight: 300 }')).toEqual(['fontWeight: 300']);
    for (const good of [...FONT_WEIGHT_UTILITIES, 'md:font-semibold']) {
      expect(weightOffences(`'${good}'`), good).toEqual([]);
    }
    expect(weightOffences('{ fontWeight: 500 }')).toEqual([]);
    expect(weightOffences("'font-sans font-mono font-display'")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------
// TOKENS ONLY (the owner, 2026-10-06): "each and every component should use the tokens only … even
// the padding, spacing, radius … so that if we update the tokens, all places where the components
// are used will change." Every design value a component, story or primitive writes must be a named
// token from the design-token layer (theme.css "Design tokens"; tokens/design.ts, tokens/scale.ts):
//
//   numeric-step   a Tailwind numeric step on a spacing, size, position, edge, type or motion utility
//                  (p-4, gap-1.5, w-64, h-0.5, top-3, -translate-y-px is fine, border-2, ring-1,
//                  outline-offset-2, leading-6, duration-150, delay-75). 0, px, auto, full, screen,
//                  fractions (w-1/2) and intrinsic keywords (min-w-0, w-fit) are not values.
//   not-a-token    a named value the token layer does not define (rounded-md, max-w-7xl, text-xs,
//                  tracking-wider, ease-out, leading-loose): checked by compiling the class against
//                  theme.css, which defines nothing but the token layer.
//   stock-easing   ease-linear | in | out | in-out: transitions take the motion roles only
//                  (duration-fast | base | slow, ease-spring | standard | emphasized).
//   arbitrary      any arbitrary value, [..] or (..), on any utility (text-[12px], h-[5px], size-[7px],
//                  inset-[3px], translate-x-[2px], rounded-[3px], gap-[6px], leading-[1.4],
//                  tracking-[.04em]), except a token reference (w-[var(--nova-sidebar-rail-w)],
//                  bg-(--nova-chrome-field), [--nova-data-edge:var(--nova-gradient-edge-kpi)]) and
//                  three value-free forms: a transition's property list, generated content, and a
//                  grid template of fr tracks and keywords (grid-cols-[auto_1fr]).
//   raw-length     a px, rem or em literal outside a class (a style object, a keyframe, a constant).
//   style-number   a bare number on a length property in a style object (style={{ width: 54 }}).
//   radius-scale   a Surface radius named by the scale (radius="md"): name the role (radius="card").
//
// The guard is absolute: every component, story and primitive file, and the Storybook preview, must
// be clean. There is no baseline and no bridge: theme.css compiles only the token layer, so a stock
// name (p-4, rounded-md, ease-out, tracking-wider, text-sm) has no style at all.
// ---------------------------------------------------------------------------------------------------

const srcDir = fileURLToPath(new URL('..', import.meta.url));
// The Storybook preview frames every story, so it is held to the same rules. So is the web app
// (apps/web/src: the shell and every module), which compiles the same theme.css: a class that is
// not a token draws nothing there either.
const WEB_SCOPE = '../../../apps/web/src';
const TOKEN_SCOPES = [
  'components',
  'stories',
  'primitives',
  '../.storybook',
  WEB_SCOPE,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
  });
}

// The web app is policed where it draws: its .tsx files. A plain .ts file or a data folder holds
// records (invented ids such as gap-retinal look like utility classes) and no styling.
const slashed = (path: string) => path.split('\\').join('/');
const webRoot = slashed(join(srcDir, WEB_SCOPE));
const drawsUi = (path: string) => {
  const file = slashed(path);
  if (!file.startsWith(webRoot)) return true;
  return file.endsWith('.tsx') && !file.includes('/data/');
};

const tokenFiles = TOKEN_SCOPES.flatMap((scope) => walk(join(srcDir, scope)))
  .filter(drawsUi)
  .map((path) => ({
    path: relative(srcDir, path).replace(/\\/g, '/'),
    text: readFileSync(path, 'utf8'),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

// The token layer as Tailwind compiles it: theme.css as shipped, the only names a component may use.
const themeCss = readFileSync(join(srcDir, 'styles/theme.css'), 'utf8');
const requireFrom = createRequire(import.meta.url);
const tailwindDir = dirname(requireFrom.resolve('tailwindcss/package.json'));
const loadStylesheet = async (id: string, base: string) => {
  const path = id === 'tailwindcss' ? join(tailwindDir, 'index.css') : id;
  return { path, base, content: readFileSync(path, 'utf8') };
};
const tokenLayer = await compile(`@import 'tailwindcss';\n${themeCss}`, {
  base: srcDir,
  loadStylesheet,
});
// The same layer as Tailwind's design system, which knows each utility's root (bg, px, from …), so
// a word that is shaped like a class (bg-surface-inset, px-s1.5) can be told from one that is not
// (from-node, inline-radio), and asked whether it compiles to anything. The API is marked unstable:
// if a Tailwind upgrade moves it, this file fails to load, never passes quietly.
const designSystem = await __unstable__loadDesignSystem(
  `@import 'tailwindcss';\n${themeCss}`,
  { base: srcDir, loadStylesheet },
);

// Which of these bare utilities the token layer defines.
function existing(utilities: readonly string[]): Set<string> {
  const css = tokenLayer.build([...utilities]);
  const selector = (utility: string) =>
    `.${utility.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)}`;
  return new Set(
    utilities.filter((utility) =>
      new RegExp(
        `${selector(utility).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`,
      ).test(css),
    ),
  );
}

// The utilities whose value is a design value (the longest root wins: rounded-tl before rounded).
const VALUE_ROOTS = [
  ...['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe'],
  ...['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me'],
  ...['gap', 'gap-x', 'gap-y', 'space-x', 'space-y', 'scroll-m', 'scroll-p'],
  ...['w', 'h', 'size', 'min-w', 'min-h', 'max-w', 'max-h', 'basis', 'indent'],
  ...['inset', 'inset-x', 'inset-y', 'inset-s', 'inset-e'],
  ...['top', 'right', 'bottom', 'left', 'start', 'end'],
  ...['translate', 'translate-x', 'translate-y'],
  ...['border', 'border-x', 'border-y', 'border-t', 'border-r', 'border-b'],
  ...['border-l', 'border-s', 'border-e', 'divide-x', 'divide-y'],
  ...['ring', 'ring-offset', 'outline', 'outline-offset', 'underline-offset'],
  ...['decoration', 'stroke', 'text', 'leading', 'tracking'],
  ...['rounded', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l'],
  ...['rounded-s', 'rounded-e', 'rounded-tl', 'rounded-tr', 'rounded-br'],
  ...['rounded-bl', 'rounded-ss', 'rounded-se', 'rounded-es', 'rounded-ee'],
  ...['duration', 'delay', 'ease'],
].sort((a, b) => b.length - a.length);

const BARE_UTILITIES =
  /^(?:border(?:-[xytrblse])?|ring|outline|rounded(?:-\w+)?)$/;
const PLACEMENT =
  /^(?:top|bottom|left|right|start|end)-(?:top|bottom|left|right|start|end|center)(?:-(?:start|end))?$/;

// Arbitrary values that carry no design value: which properties a transition animates, generated
// content, and a grid template of fr tracks, repeat counts and keywords. A track ends at the next
// separator (an underscore, a comma or a bracket), so 2fr_1fr is two tracks.
const VALUE_FREE_ARBITRARY = /^(?:transition|content|will-change)$/;
const GRID_TEMPLATE = /^(?:grid-cols|grid-rows|col|row|col-span|row-span)$/;
// Arbitrary properties whose numbers are geometry, not design values: a path drawn with pathLength
// 1 (stroke-dasharray, stroke-dashoffset), a clip shape in percentages.
const GEOMETRY_PROPERTIES =
  /^(?:stroke-dasharray|stroke-dashoffset|clip-path)$/;

// A token reference: var(--x) (with token fallbacks), the (--x) shorthand, either with a type hint.
function isTokenReference(value: string): boolean {
  let rest = value.replace(/^\w+(?:-\w+)*:/, '');
  if (/^--[\w-]+$/.test(rest)) return true;
  for (let previous = ''; previous !== rest; ) {
    previous = rest;
    rest = rest.replace(
      /var\(--[\w-]+(?:,([^()]*))?\)/g,
      (_, fallback?: string) => fallback ?? '',
    );
  }
  return rest.replace(/[\s,_]/g, '') === '';
}

// A class with its variants (hover:, md:, [&_svg]:, data-[state=open]:) and important mark removed.
function bareUtility(cls: string): string {
  let depth = 0;
  let last = 0;
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) last = i + 1;
  }
  return cls.slice(last).replace(/^!|!$/g, '');
}

type Rule =
  | 'numeric-step'
  | 'not-a-token'
  | 'stock-easing'
  | 'arbitrary'
  | 'raw-length'
  | 'style-number'
  | 'radius-scale'
  | 'unknown-colour'
  | 'unknown-utility';

// The colour utilities that are not already value roots above (text, border, ring, outline, stroke
// and decoration are, so an unknown colour on them is not-a-token): a class on one of these roots
// must name a colour theme.css's @theme blocks define (--color-*: initial clears the stock palette,
// so bg-white, bg-surface-inset or from-sky-400 compile to nothing and the element paints nothing).
const COLOUR_ROOTS =
  /^-?(?:bg|fill|divide|from|via|to|placeholder|caret|accent)-/;

// Words in a string literal that Tailwind would parse as a class but that name something else.
const NOT_CLASSES: Record<string, string> = {
  'inline-radio': "a Storybook control type (argTypes' control)",
  'from-node': "Timeline's rail kind: the rail starts at the node",
  'to-node': "Timeline's rail kind: the rail ends at the node",
};

// A word shaped like a utility: a class Tailwind would parse (it starts with a utility root it
// knows) and that carries a value or a variant, so a plain English word ("to", "inset") is not one.
function classShaped(cls: string, utility: string): boolean {
  if (/[${}'"`\\]/.test(cls) || cls in NOT_CLASSES) return false;
  if (!utility.includes('-') && utility === cls) return false;
  if (PLACEMENT.test(utility.replace(/^-/, ''))) return false;
  try {
    return designSystem.parseCandidate(utility).length > 0;
  } catch {
    return false;
  }
}

interface Offence {
  rule: Rule;
  found: string;
}

// The string literals in a source file, comments removed.
const STRING_LITERAL =
  /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

interface ClassCheck {
  utility: string;
  needsToken: boolean;
  offence?: Offence;
}

// The rule a class breaks, if any; or that it must be checked against the token layer.
function classify(cls: string): ClassCheck | undefined {
  const utility = bareUtility(cls);
  // An arbitrary property: [prop:value].
  const property = /^\[([a-z-]+|--[\w-]+):(.+)\]$/.exec(utility);
  if (property) {
    const [, name = '', value = ''] = property;
    const allowed =
      isTokenReference(value) ||
      !/\d/.test(value.replace(/(?<![\d.])0(?![\d.])/g, '')) ||
      GEOMETRY_PROPERTIES.test(name);
    return allowed
      ? undefined
      : {
          utility,
          needsToken: false,
          offence: { rule: 'arbitrary', found: cls },
        };
  }
  // A fraction (w-1/2, -translate-x-1/2) is a proportion, not a value.
  if (/(?:^|-)\d+\/\d+$/.test(utility)) return undefined;
  const shaped =
    /^(-?)([a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*)(?:-(\[[^\]]+\]|\([^)]+\)|[a-z0-9][\w./%-]*))?(?:\/[\w.[\]]+)?$/.exec(
      utility,
    );
  if (!shaped) return undefined;
  // An arbitrary value on any utility.
  const arbitrary =
    /^(-?)([a-z][\w-]*?)-(\[(.+)\]|\((.+)\))(?:\/[\w.[\]]+)?$/.exec(utility);
  if (arbitrary) {
    const root = arbitrary[2] ?? '';
    const value = arbitrary[4] ?? arbitrary[5] ?? '';
    const allowed =
      isTokenReference(value) ||
      (VALUE_FREE_ARBITRARY.test(root) &&
        (root === 'content' || !/\d/.test(value))) ||
      (GRID_TEMPLATE.test(root) &&
        !/\d/.test(
          value.replace(
            /\d+(?:\.\d+)?fr(?![a-z\d])|repeat\(\d+|minmax\(0,/g,
            '',
          ),
        ));
    return allowed
      ? undefined
      : {
          utility,
          needsToken: false,
          offence: { rule: 'arbitrary', found: cls },
        };
  }
  const name = utility.replace(/^-/, '').replace(/\/[\w.[\]]+$/, '');
  const root = VALUE_ROOTS.find(
    (candidate) => name === candidate || name.startsWith(`${candidate}-`),
  );
  if (root === undefined) return undefined;
  const value = name === root ? '' : name.slice(root.length + 1);
  // A bare root is a class only for the edge and corner utilities (border, ring, outline, rounded);
  // 'p', 'top' or 'text' alone, or a placement such as 'bottom-right', is a word, not a class.
  if (value === '' && !BARE_UTILITIES.test(root)) return undefined;
  if (PLACEMENT.test(name)) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(value) && value !== '0') {
    return {
      utility,
      needsToken: false,
      offence: { rule: 'numeric-step', found: cls },
    };
  }
  if (root === 'ease' && /^(?:linear|in|out|in-out)$/.test(value)) {
    return {
      utility,
      needsToken: false,
      offence: { rule: 'stock-easing', found: cls },
    };
  }
  return { utility, needsToken: true };
}

// Every token-rule offence in one file's source.
function tokenOffences(text: string): Offence[] {
  const source = code(text);
  const checks: Array<{ cls: string; check: ClassCheck }> = [];
  const shaped: Array<{ cls: string; utility: string }> = [];
  const offences: Offence[] = [];
  for (const literal of source.match(STRING_LITERAL) ?? []) {
    for (const token of literal.slice(1, -1).split(/\s+/)) {
      if (token === '') continue;
      const check = classify(token);
      if (check?.offence) offences.push(check.offence);
      else if (check?.needsToken) checks.push({ cls: token, check });
      else if (
        check === undefined &&
        /\d(?:\.\d+)?(?:px|rem|em)\b/.test(token)
      ) {
        offences.push({ rule: 'raw-length', found: token });
      } else if (check === undefined) {
        const utility = bareUtility(token);
        if (classShaped(token, utility)) shaped.push({ cls: token, utility });
      }
    }
  }
  const defined = existing([...new Set(checks.map((c) => c.check.utility))]);
  for (const { cls, check } of checks) {
    if (!defined.has(check.utility)) {
      offences.push({ rule: 'not-a-token', found: cls });
    }
  }
  // Every other class must exist: a colour theme.css defines, a utility Tailwind or theme.css has.
  const compiled = designSystem.candidatesToCss(
    shaped.map((entry) => entry.utility),
  );
  shaped.forEach(({ cls, utility }, index) => {
    if (compiled[index]) return;
    offences.push({
      rule: COLOUR_ROOTS.test(utility) ? 'unknown-colour' : 'unknown-utility',
      found: cls,
    });
  });
  // A bare number on a length property in a style object: React reads it as pixels.
  for (const style of source.match(/style=\{\{[\s\S]*?\}\}/g) ?? []) {
    for (const match of style.matchAll(
      /\b(width|height|min[A-Z]\w*|max[A-Z]\w*|top|left|right|bottom|inset\w*|padding\w*|margin\w*|gap|rowGap|columnGap|fontSize|lineHeight|letterSpacing|borderRadius|border\w*Width|outline\w*|flexBasis)\s*:\s*(-?\d+(?:\.\d+)?)\b(?!\s*[%`'"])/g,
    )) {
      if (Number(match[2]) !== 0) {
        offences.push({ rule: 'style-number', found: match[0] });
      }
    }
  }
  for (const match of source.matchAll(/\bradius=["'{]{1,2}(sm|md|lg|xl)\b/g)) {
    offences.push({ rule: 'radius-scale', found: match[0] });
  }
  return offences;
}

const measured = Object.fromEntries(
  tokenFiles.map((file) => [file.path, tokenOffences(file.text)]),
);

describe('tokens only: every design value is a named token', () => {
  it('finds the components, stories and primitives it polices', () => {
    expect(tokenFiles.length).toBeGreaterThan(150);
    expect(tokenFiles.map((file) => file.path)).toContain(
      'components/button/button.tsx',
    );
  });

  it('holds every component, story, primitive and the preview to tokens only', () => {
    const offending = Object.entries(measured)
      .filter(([, found]) => found.length > 0)
      .map(([path, found]) => ({
        path,
        offences: found.map((offence) => `${offence.rule}: ${offence.found}`),
      }));
    expect(offending).toEqual([]);
  });

  it('polices the Storybook preview too', () => {
    expect(Object.keys(measured)).toContain('../.storybook/preview.tsx');
  });

  it('polices the web app too: the shell and every module', () => {
    expect(Object.keys(measured)).toContain(`${WEB_SCOPE}/app/app.tsx`);
    expect(Object.keys(measured)).toContain(`${WEB_SCOPE}/main.tsx`);
    expect(Object.keys(measured)).toContain(
      `${WEB_SCOPE}/modules/doctor/tabs/queue/queue-view.tsx`,
    );
  });

  // Data files hold no styling, only invented records whose ids (gap-retinal, pt-lakshmi-devi) are
  // shaped like utility classes. The web scan covers the UI, which is .tsx, and never a data folder.
  it('leaves the web data folders and plain .ts files out, since they hold records and no classes', () => {
    const scanned = Object.keys(measured);
    const web = scanned.filter((path) => path.startsWith(WEB_SCOPE));
    expect(web.length).toBeGreaterThan(50);
    expect(web.filter((path) => path.endsWith('.ts'))).toEqual([]);
    expect(web.filter((path) => /\/data\//.test(path))).toEqual([]);
  });

  it.each([
    'bg-surface-inset',
    'bg-surface-sunken',
    'bg-canvas',
    'bg-white/10',
    'hover:bg-white/20',
    'md:bg-surface-subtle',
    'bg-red-500',
    'fill-bogus',
    'from-sky-400',
    'via-white',
    'to-bogus',
    'divide-bogus',
    'placeholder:text-ink-2 placeholder-bogus',
    'caret-white',
    'accent-bogus',
  ])('unknown-colour refuses %s', (cls) => {
    expect(rules(cls)).toEqual(['unknown-colour']);
  });

  // An unknown colour on a value root (text, border, ring, outline, stroke) is not-a-token.
  it.each([
    'text-white/50',
    'border-white/20',
    'ring-bogus',
    'outline-white',
    'stroke-bogus',
    'px-s1.5',
  ])('not-a-token refuses the unknown %s', (cls) => {
    expect(rules(cls)).toEqual(['not-a-token']);
  });

  it.each([
    'grid-cols-bogus',
    'animate-bogus',
    'z-bogus',
    'font-bogus',
    'hover:opacity-bogus',
  ])('unknown-utility refuses %s', (cls) => {
    expect(rules(cls)).toEqual(['unknown-utility']);
  });

  it.each([
    'bg-surface',
    'bg-surface-2',
    'bg-bg',
    'bg-primary/80',
    'hover:bg-primary-ghost',
    'from-ai to-primary',
    'fill-ai-bright',
    'divide-border',
    'caret-primary',
    'animate-pulse',
    'nova-card-head',
    'sr-only',
    'to node',
    'from-node',
    'inline-radio',
    'bottom-right',
    'Reception / OPD',
    'well-known',
    'aria-label',
  ])('the existence check lets %s through', (cls) => {
    expect(tokenOffences(`\`${cls}\``)).toEqual([]);
  });

  // The conversion is finished: nothing in theme.css keeps a stock name compiling.
  it('keeps no conversion bridge and no stock scale in theme.css', () => {
    expect(themeCss).not.toMatch(/Conversion bridge/i);
    expect(themeCss).not.toMatch(/--spacing:\s/);
    expect(themeCss).not.toMatch(/--radius-(?:sm|md|lg|xl)\s*:/);
    expect(themeCss).not.toMatch(/--tracking-wider\s*:/);
    expect(themeCss).not.toMatch(/--ease-(?:in|out|in-out|linear)\s*:/);
  });

  it('compiles no numeric step, scale radius, container width, stock type or easing from theme.css', () => {
    const stock = [
      'p-4',
      'px-2.5',
      'm-1',
      'gap-1.5',
      'w-64',
      'h-0.5',
      'size-3',
      'top-3',
      'rounded-md',
      'rounded-t-lg',
      'rounded',
      'rounded-sm',
      'rounded-lg',
      'rounded-xl',
      'max-w-7xl',
      'text-xs',
      'text-sm',
      'text-base',
      'text-2xl',
      'leading-6',
      'tracking-wider',
      'tracking-wide',
      'ease-out',
      'ease-in',
      'ease-in-out',
    ];
    expect([...existing(stock)]).toEqual([]);
    const tokens = [
      'p-s5',
      'gap-s2',
      'p-0',
      'p-px',
      '-mt-px',
      'mx-auto',
      'w-full',
      'w-1/2',
      'min-w-0',
      'h-control-md',
      'min-h-control-sm',
      'px-control-md',
      'py-control-sm',
      'gap-control',
      'px-field',
      'pl-field-icon',
      'left-field',
      'p-card',
      'py-card-bar',
      'gap-card',
      'p-overlay',
      'px-chip',
      'py-chip',
      'gap-chip',
      'px-tag',
      'py-badge',
      'py-row-compact',
      'py-row-comfortable',
      'min-h-touch',
      'min-w-touch',
      'size-touch-sm',
      'size-icon-sm',
      'size-icon-md',
      'size-icon-lg',
      'size-dot',
      'size-mark',
      'w-rail',
      'w-sidebar',
      'max-w-md',
      'max-w-3xl',
      'rounded-control',
      'rounded-card',
      'rounded-overlay',
      'rounded-chip',
      'rounded-pill',
      'rounded-full',
      'rounded-none',
      'rounded-t-card',
      'text-micro',
      'text-label',
      'text-control',
      'text-kpi',
      'leading-body',
      'tracking-h2',
      'tracking-eyebrow',
      'border',
      'border-emphasis',
      'border-l-rail',
      'ring-hairline',
      'ring-emphasis',
      'outline-focus',
      'outline-offset-focus',
      'underline-offset-tight',
      'duration-base',
      'ease-standard',
      'transition-colors',
    ];
    expect(tokens.filter((name) => !existing(tokens).has(name))).toEqual([]);
  });

  // One planted violation per rule, and the forms each rule lets through.
  const rules = (cls: string) => tokenOffences(`\`${cls}\``).map((o) => o.rule);

  it.each([
    'p-4',
    'px-2.5',
    'gap-1.5',
    '-mt-1',
    'md:gap-x-10',
    'hover:p-6',
    'space-y-3',
    'w-64',
    'h-0.5',
    'size-3.5',
    'min-h-11',
    'max-w-80',
    'inset-x-4',
    'top-3',
    '-translate-y-0.5',
    'translate-x-5.25',
    'basis-4',
    'border-2',
    'border-l-3',
    'ring-1',
    'outline-2',
    'outline-offset-2',
    'underline-offset-4',
    'stroke-2',
    'leading-6',
    'duration-150',
    'delay-75',
    '[&_svg]:size-4',
  ])('numeric-step refuses %s', (cls) => {
    expect(rules(cls)).toEqual(['numeric-step']);
  });

  it.each([
    'rounded-md',
    'rounded-sm',
    'rounded',
    'rounded-2xl',
    'rounded-t-lg',
    'max-w-7xl',
    'max-w-3xs',
    'text-xs',
    'text-base',
    'tracking-wider',
    'leading-loose',
    'w-prose-ish',
  ])('not-a-token refuses %s', (cls) => {
    expect(rules(cls)).toEqual(['not-a-token']);
  });

  it.each(['ease-out', 'ease-in', 'ease-in-out', 'ease-linear'])(
    'stock-easing refuses %s',
    (cls) => {
      expect(rules(cls)).toEqual(['stock-easing']);
    },
  );

  it.each([
    'text-[12.5px]',
    'h-[5px]',
    'w-[30px]',
    'size-[7px]',
    'inset-[3px]',
    '-inset-[7px]',
    'top-[3px]',
    'translate-x-[2px]',
    'rounded-[3px]',
    'shadow-[0_1px_2px_black]',
    'gap-[6px]',
    'leading-[1.4]',
    'tracking-[.04em]',
    'max-h-[70vh]',
    'w-[88%]',
    'scale-[0.97]',
    'z-[60]',
    'border-[1.5px]',
    'align-[-0.125em]',
    'bg-[white]',
    'w-[var(--nova-sidebar-rail-w,4.25rem)]',
    'grid-cols-[16rem_minmax(0,1fr)]',
    'grid-cols-[2fr_120px]',
    'grid-cols-[1fr_3]',
    '[--nova-ai-angle:45deg]',
  ])('arbitrary refuses %s', (cls) => {
    expect(rules(cls)).toEqual(['arbitrary']);
  });

  it('raw-length refuses a px, rem or em literal outside a class, and style-number a bare length', () => {
    expect(
      tokenOffences("{ transform: 'translateY(-3px)' }").map((o) => o.rule),
    ).toEqual(['raw-length']);
    expect(
      tokenOffences("const DESKTOP = '(min-width: 48rem)';").map((o) => o.rule),
    ).toEqual(['raw-length']);
    expect(
      tokenOffences('<div style={{ width: 54, top: 0 }} />').map((o) => o.rule),
    ).toEqual(['style-number']);
    expect(
      tokenOffences('<div style={{ width: `${percent}%`, height }} />'),
    ).toEqual([]);
    expect(tokenOffences("'translateX(${box.left}px)'")).toEqual([]);
  });

  it('radius-scale refuses a Surface radius named by the scale', () => {
    expect(
      tokenOffences('<Surface material="card" radius="md" />').map(
        (o) => o.rule,
      ),
    ).toEqual(['radius-scale']);
    expect(tokenOffences('<Surface material="card" radius="card" />')).toEqual(
      [],
    );
  });

  it.each([
    'p-s5',
    'hover:px-s6',
    'p-0',
    'p-px',
    '-mt-px',
    'mx-auto',
    'mt-auto',
    'w-full',
    'h-screen',
    'w-1/2',
    '-translate-x-1/2',
    'min-w-0',
    'w-fit',
    'size-icon-md',
    '[&_svg]:size-icon-sm',
    'h-control-md',
    'px-control-md',
    'rounded-control',
    'md:rounded-card',
    'rounded-full',
    'text-label',
    'text-ink-2',
    'text-left',
    'text-on-primary/80',
    'border',
    'border-border',
    'border-b-0',
    'ring-inset',
    'ring-primary',
    'outline-none',
    'duration-base',
    'motion-safe:ease-standard',
    'transition-[color,background-color,box-shadow]',
    "before:content-['✦'_/_'']",
    'grid-cols-[auto_1fr]',
    'grid-cols-[auto_repeat(2,max-content)_max-content]',
    'grid-cols-[2fr_1fr]',
    'md:grid-cols-[3fr_2fr]',
    'grid-rows-[1fr_2.5fr_auto]',
    'w-[var(--nova-sidebar-rail-w)]',
    'bg-(--nova-chrome-field)',
    'text-[color:var(--nova-chrome-ink-2)]',
    'focus-visible:outline-[var(--nova-focus-ring,var(--nova-color-primary))]',
    'hover:[--nova-surface-lift:var(--nova-shadow-md)]',
    '[--nova-surface-lift:none]',
    '[stroke-dasharray:1]',
    'flex-1',
    'shrink-0',
    'z-10',
    'opacity-50',
    'col-span-2',
    'grid-cols-3',
  ])('lets %s through', (cls) => {
    expect(tokenOffences(`\`${cls}\``)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------
// theme.css: no raw value inside an @utility. A utility reaches every value through a token
// (var(--nova-…)), so changing the token changes every surface built on it. The token definitions
// themselves (:root, the scheme and material blocks, @theme) are where literals live, and are not
// checked here.
// ---------------------------------------------------------------------------------------------------

// Pending owner decision (2026-10-09): the neon AI button look (AiButton, Button variant="ai", the
// nova-ai-* neon, conic and aura utilities) waits on the owner, so its literals are left as they are.
// Remove each entry once the decision lands and the utility reaches its values through tokens.
const PENDING_OWNER_DECISION_UTILITIES: readonly string[] = [
  'animate-ai-burst', // pending owner decision (2026-10-09)
  'nova-ai-halo', // pending owner decision (2026-10-09)
  'nova-ai-glow', // pending owner decision (2026-10-09)
  'nova-ai-hero-fill', // pending owner decision (2026-10-09)
  'nova-ai-hero-aura', // pending owner decision (2026-10-09)
  'nova-ai-badge', // pending owner decision (2026-10-09)
  'nova-ai-badge-pill', // pending owner decision (2026-10-09)
  'nova-ai-conic-border', // pending owner decision (2026-10-09)
  'nova-ai-static-border', // pending owner decision (2026-10-09)
];

// A hex colour, an rgb()/hsl() colour, or a px or rem length.
const RAW_VALUE =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(|(?<![\w-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem)\b/g;

function utilityBodies(css: string): Array<{ name: string; body: string }> {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: Array<{ name: string; body: string }> = [];
  for (const match of text.matchAll(/@utility\s+([\w-]+)\s*\{/g)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    let depth = 0;
    let close = open;
    for (; close < text.length; close++) {
      if (text[close] === '{') depth++;
      else if (text[close] === '}' && --depth === 0) break;
    }
    found.push({ name: match[1] ?? '', body: text.slice(open + 1, close) });
  }
  return found;
}

const rawValues = (css: string) =>
  utilityBodies(css)
    .map(({ name, body }) => ({
      name,
      raw: [...new Set(body.match(RAW_VALUE) ?? [])],
    }))
    .filter((entry) => entry.raw.length > 0);

describe('theme.css utilities take every value from a token', () => {
  it('finds the utilities it polices', () => {
    expect(utilityBodies(themeCss).length).toBeGreaterThan(40);
  });

  it('writes no raw hex, rgb() or px / rem length inside an @utility', () => {
    expect(
      rawValues(themeCss).filter(
        (entry) => !PENDING_OWNER_DECISION_UTILITIES.includes(entry.name),
      ),
    ).toEqual([]);
  });

  it('keeps the pending allowlist honest: each entry still exists and still has a literal', () => {
    const raw = rawValues(themeCss).map((entry) => entry.name);
    for (const name of PENDING_OWNER_DECISION_UTILITIES) {
      expect(raw, name).toContain(name);
    }
  });

  it('refuses a planted hex, rgb(), px or rem, nested rules included, and lets tokens through', () => {
    for (const bad of [
      '@utility x { color: #fff; }',
      '@utility x { box-shadow: inset 0 1px 0 rgba(255,255,255,.1); }',
      '@utility x { --nova-focus-ring: rgb(255 255 255 / 0.9); }',
      '@utility x { border-radius: 7px; }',
      '@utility x { &::before { inset: -3px; } }',
      '@utility x { width: 1.5rem; }',
      '@utility x { background-size: .5rem .5rem; }',
    ]) {
      expect(rawValues(bad), bad).not.toEqual([]);
    }
    for (const good of [
      '@utility x { color: var(--nova-color-ink); }',
      '@utility x { padding: var(--nova-border-hairline); inset: 0; }',
      '@utility x { width: 50%; transform: translateX(-120%) skewX(-18deg); }',
      '@utility x { animation: a calc(var(--nova-duration-slow) * 3) linear; }',
      ':root { --nova-x: #fff; --nova-y: 7px; }',
      '@theme inline { --color-x: #fff; }',
    ]) {
      expect(rawValues(good), good).toEqual([]);
    }
  });
});
