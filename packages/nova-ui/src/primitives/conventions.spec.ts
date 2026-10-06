// @vitest-environment node
// Nova's component rules, enforced. Components are composed from tokens and primitives (SOLID:
// each primitive has one job, components depend on them instead of re-implementing them), so a
// change to class merging, the focus ring or a surface happens in one place and reaches all of them.
// The scales they police are the HOS prototype's (os/public/assets/hos.css), from tokens/scale.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FONT_WEIGHT_UTILITIES,
  PROTOTYPE_TYPE_SIZES,
  RADIUS_UTILITIES,
  SHADOW_UTILITIES,
  SPACING_STEPS,
} from '../tokens/scale';

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

// Padding, margin, gap and space utilities, with a numeric, px, auto or arbitrary value, negative
// margins included. Sizes (h-, w-, size-), insets and translate are not spacing and are not matched.
const SPACING_UTILITY = new RegExp(
  CLASS_START +
    /-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-(?:\[[^\]]*\]|\([^)]*\)|\d+(?:\.\d+)?|px|auto)(?![\w.-])/
      .source,
  'g',
);
const isMargin = (utility: string) => /^-?m[xytrblse]?-/.test(utility);

function spacingOffences(text: string): string[] {
  return [...code(text).matchAll(SPACING_UTILITY)]
    .map((match) => match[0])
    .filter((utility) => {
      const step = utility.slice(utility.lastIndexOf('-') + 1);
      // A negative step names its positive value; auto is only a margin; anything else is arbitrary.
      if (step === 'auto') return !isMargin(utility);
      return !SPACING_STEPS.includes(step) || /[[(]/.test(utility);
    });
}

// Every rounded-* class must be one of RADIUS_UTILITIES: that leaves out the bare rounded, the stock
// 2xl / 3xl, the per-side and per-corner forms and arbitrary values.
const ROUNDED_UTILITY = new RegExp(
  CLASS_START + /rounded(?:-[^\s'"`),]+)?(?![\w-])/.source,
  'g',
);
const radiusOffences = (text: string): string[] =>
  [...code(text).matchAll(ROUNDED_UTILITY)]
    .map((match) => match[0])
    .filter(
      (utility) => !(RADIUS_UTILITIES as readonly string[]).includes(utility),
    );

// A text size is one of the prototype's, written text-[Npx] with N in PROTOTYPE_TYPE_SIZES. Tailwind's
// stock sizes, the retired Apple ramp, an arbitrary size off the list and a variable size all fail.
// An arbitrary colour (text-[color:…], text-[var(--…)]) is a colour, not a size.
const NAMED_TEXT_SIZE = new RegExp(
  CLASS_START +
    /(?:[\w-]+:)*text-(?:xs|sm|base|lg|xl|\d+xl|micro|caption|callout|body|headline|title\d)(?![\w-])/
      .source,
  'g',
);
const ARBITRARY_TEXT_SIZE = new RegExp(
  CLASS_START +
    /(?:[\w-]+:)*text-(?:\[(?!color:|#|rgb|hsl|oklch|var\()[^\]]*\]|\(length:[^)]*\))/
      .source,
  'g',
);
const isPrototypeSize = (utility: string) => {
  const px = /^text-\[(\d+(?:\.\d+)?)px\]$/.exec(bare(utility));
  return (
    px !== null &&
    (PROTOTYPE_TYPE_SIZES as readonly number[]).includes(Number(px[1]))
  );
};
const typeOffences = (text: string): string[] => [
  ...[...code(text).matchAll(NAMED_TEXT_SIZE)].map((match) => match[0]),
  ...[...code(text).matchAll(ARBITRARY_TEXT_SIZE)]
    .map((match) => match[0])
    .filter((utility) => !isPrototypeSize(utility)),
];

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

  // The prototype's sizes (PROTOTYPE_TYPE_SIZES) are the only sizes.
  it('sizes text only with the prototype sizes, written text-[Npx]', () => {
    expect(offences(typeOffences)).toEqual([]);
  });

  // The spacing scale (tokens/scale.ts): every padding, margin and gap is a step of it.
  it('spaces boxes only on the spacing scale, never an off-scale step or an arbitrary value', () => {
    expect(offences(spacingOffences)).toEqual([]);
  });

  // The radius grammar (tokens/scale.ts): sm / md / lg / xl, full for pills and circles, none.
  it('rounds corners only with the radius grammar, never a per-side form or an arbitrary radius', () => {
    expect(offences(radiusOffences)).toEqual([]);
  });

  it('the spacing guard rejects off-scale and arbitrary spacing and accepts the scale', () => {
    for (const bad of [
      'p-1.25',
      'py-3.5',
      'pl-10',
      'pr-14',
      'gap-7',
      'px-7',
      '-mt-3.5',
      'md:gap-x-10',
      'hover:p-16',
      '[&>svg]:ms-9',
      'space-y-16',
      'p-[13px]',
      'mx-[var(--x)]',
      'gap-(--gap)',
      'py-20',
    ]) {
      expect(spacingOffences(`'${bad}'`), bad).toEqual([bare(bad)]);
    }
    for (const good of [
      'p-0',
      'p-px',
      'p-0.5',
      'p-1.5',
      'py-2.5',
      'px-3',
      'py-12',
      'gap-x-2',
      'gap-y-1',
      'gap-1.5',
      '-mr-2',
      'sm:px-6',
      'mx-auto',
      'mt-auto',
      'space-y-4',
      'size-2.5',
      'h-11',
      'min-h-16',
      'pl-4',
      'top-1.5',
      'translate-x-5',
      'text-[11px]',
      'pointer-events-none',
      'space-x-reverse',
    ]) {
      expect(spacingOffences(`'${good}'`), good).toEqual([]);
    }
    // Margins may be auto; paddings and gaps may not.
    expect(spacingOffences("'p-auto'")).toEqual(['p-auto']);
  });

  it('the radius guard rejects per-side, per-corner, bare and arbitrary radii and accepts the grammar', () => {
    for (const bad of [
      'rounded',
      'rounded-xs',
      'rounded-2xl',
      'rounded-3xl',
      'rounded-t-lg',
      'rounded-tl-md',
      'rounded-s-sm',
      'rounded-[3px]',
      'rounded-[inherit]',
      'hover:rounded-t-xl',
    ]) {
      expect(radiusOffences(`'${bad}'`), bad).toEqual([bare(bad)]);
    }
    for (const good of RADIUS_UTILITIES) {
      expect(radiusOffences(`'${good} p-4'`), good).toEqual([]);
    }
    expect(radiusOffences("'md:rounded-lg'")).toEqual([]);
  });

  it('the type guard rejects stock, retired-ramp, off-list and variable sizes and accepts the prototype sizes and text colours', () => {
    for (const bad of [
      'text-xs',
      'text-sm',
      'text-base',
      'text-lg',
      'text-xl',
      'text-2xl',
      'md:text-9xl',
      'text-caption',
      'text-callout',
      'text-body',
      'text-title3',
      'text-[17.5px]',
      'text-[1rem]',
      'text-[length:var(--x)]',
      'text-(length:--x)',
      'sm:text-[18px]',
    ]) {
      expect(typeOffences(`'${bad}'`).map(bare), bad).toEqual([bare(bad)]);
    }
    for (const good of [
      ...PROTOTYPE_TYPE_SIZES.map((px) => `text-[${px}px]`),
      'md:text-[13.5px]',
      'text-ink-2',
      'text-left',
      'text-center',
      'text-primary',
      'text-[color:var(--nova-chrome-ink-2)]',
      'text-[var(--nova-sidebar-ink-2)]',
    ]) {
      expect(typeOffences(`'${good}'`), good).toEqual([]);
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
