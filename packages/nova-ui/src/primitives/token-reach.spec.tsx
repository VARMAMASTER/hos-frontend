// Changing a token changes the component. The four reference components (Button, TextField, Card,
// Chip) are rendered, their classes compiled by Tailwind against the token layer alone (theme.css
// with the conversion bridge cut out, so a class that is not a token has no style at all), and each
// element's padding, height, radius and type worked out the way the browser would: the matching
// utility rules in stylesheet order, every var() chain followed through theme.css's :root tokens,
// and calc() evaluated. jsdom computes no custom properties and no cascade from a stylesheet, so this
// is a browser-less resolution of the compiled CSS. It then overrides the scale, a component token,
// the radius scale and a type role, and checks that the computed values follow.
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { TextField } from '../components/text-field/text-field';

afterEach(() => cleanup());

// A path, not new URL(…): under jsdom, URL resolves against the page's origin, not the file.
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(join(srcDir, 'styles/theme.css'), 'utf8');
const tokenLayerCss = themeCss.replace(
  /\/\* ===== Conversion bridge \(begin\) =====[\s\S]*?\/\* ===== Conversion bridge \(end\) ===== \*\//,
  '',
);
const requireFrom = createRequire(import.meta.url);
const tailwindDir = dirname(requireFrom.resolve('tailwindcss/package.json'));
const compiler = await compile(`@import 'tailwindcss';\n${tokenLayerCss}`, {
  base: srcDir,
  loadStylesheet: async (id, base) => {
    const path = id === 'tailwindcss' ? join(tailwindDir, 'index.css') : id;
    return { path, base, content: readFileSync(path, 'utf8') };
  },
});

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function closingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  throw new Error('unclosed block');
}

// The plain declarations of a block, its nested blocks left out.
function declarations(body: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  let depth = 0;
  let statement = '';
  for (const c of body) {
    if (c === '{') {
      depth++;
      statement = '';
    } else if (c === '}') {
      depth--;
      statement = '';
    } else if (c === ';' && depth === 0) {
      const colon = statement.indexOf(':');
      if (colon > 0) {
        found.push([
          statement.slice(0, colon).trim(),
          statement.slice(colon + 1).trim(),
        ]);
      }
      statement = '';
    } else if (depth === 0) {
      statement += c;
    }
  }
  return found;
}

// Every top-level rule of a stylesheet (descending into @layer, not into @media or @supports, which
// hold variants and fallbacks), as [selector, declarations], in order.
function rules(css: string): Array<[string, Array<[string, string]>]> {
  const found: Array<[string, Array<[string, string]>]> = [];
  let rest = stripComments(css);
  for (let open = rest.indexOf('{'); open !== -1; open = rest.indexOf('{')) {
    const close = closingBrace(rest, open);
    const selector = rest.slice(0, open).split(/[;}]/).pop()?.trim() ?? '';
    const body = rest.slice(open + 1, close);
    if (selector.startsWith('@layer')) found.push(...rules(body));
    else if (!selector.startsWith('@'))
      found.push([selector, declarations(body)]);
    rest = rest.slice(close + 1);
  }
  return found;
}

// The token values every element inherits from :root (the prototype defaults and the design tokens).
const rootTokens = Object.fromEntries(
  rules(themeCss)
    .filter(([selector]) =>
      selector
        .split(',')
        .map((s) => s.trim())
        .includes(':root'),
    )
    .flatMap(([, list]) => list),
);

const escape = (cls: string) => cls.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);

// The declared value of each property on an element, as the cascade would leave it: the element's
// utility rules in stylesheet order, the last one winning.
function declared(element: Element): Record<string, string> {
  const classes = [...element.classList];
  const css = compiler.build(classes);
  const mine = new Set(classes.map((cls) => `.${escape(cls)}`));
  const result: Record<string, string> = {};
  for (const [selector, list] of rules(css)) {
    if (!mine.has(selector)) continue;
    for (const [property, value] of list) result[property] = value;
  }
  return result;
}

// A value with every var() followed to the end (a missing token takes its fallback) and calc()
// worked out: lengths come back in px, unitless numbers as numbers.
function resolve(value: string, tokens: Record<string, string>): string {
  let text = value;
  for (let pass = 0; pass < 20 && text.includes('var('); pass++) {
    text = text.replace(
      /var\((--[\w-]+)(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g,
      (_, name: string, fallback?: string) =>
        tokens[name] !== undefined ? `(${tokens[name]})` : (fallback ?? ''),
    );
  }
  const arithmetic = text.replace(/calc\(/g, '(').replace(/px/g, '');
  if (/\d/.test(arithmetic) && /^[\d\s.()+\-*/]+$/.test(arithmetic)) {
    const number = evaluate(arithmetic);
    return /px/.test(text) ? `${Number(number.toFixed(4))}px` : String(number);
  }
  return text.trim();
}

// + - * / over numbers and brackets: all calc() needs here.
function evaluate(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/]/g) ?? [];
  let at = 0;
  const factor = (): number => {
    const token = tokens[at++];
    if (token === '(') {
      const value = sum();
      at++;
      return value;
    }
    if (token === '-') return -factor();
    return Number(token);
  };
  const product = (): number => {
    let value = factor();
    while (tokens[at] === '*' || tokens[at] === '/') {
      const op = tokens[at++];
      value = op === '*' ? value * factor() : value / factor();
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (tokens[at] === '+' || tokens[at] === '-') {
      const op = tokens[at++];
      value = op === '+' ? value + product() : value - product();
    }
    return value;
  };
  return sum();
}

function computed(
  element: Element,
  property: string,
  overrides: Record<string, string> = {},
): string {
  const value = declared(element)[property];
  if (value === undefined) {
    throw new Error(
      `${property} is not set on <${element.tagName.toLowerCase()} class="${element.className}">`,
    );
  }
  return resolve(value, { ...rootTokens, ...overrides });
}

const mount = (ui: ReactElement) => render(ui).container;
const one = (container: HTMLElement, selector: string): Element => {
  const element = container.querySelector(selector);
  if (element === null) throw new Error(`no ${selector}`);
  return element;
};

describe('changing a token changes the component (the reference components)', () => {
  const parts = () => {
    const button = one(mount(<Button>Save</Button>), 'button');
    const small = one(mount(<Button size="sm">Save</Button>), 'button');
    const field = mount(<TextField label="Ward" />);
    const card = mount(
      <Card>
        <CardHeader title="Vitals" />
        <CardBody>Ramesh</CardBody>
      </Card>,
    );
    const chip = one(mount(<Chip tone="good">Stable</Chip>), 'span');
    return {
      button,
      small,
      input: one(field, 'input'),
      label: one(field, 'label'),
      card: one(card, '[data-surface]'),
      head: one(card, '.nova-card-head'),
      heading: one(card, 'h2'),
      body: one(card, '[data-surface] > div:last-child'),
      chip,
    };
  };

  it('renders the prototype values from the tokens as they are', () => {
    const p = parts();
    expect(computed(p.button, 'padding-inline')).toBe('16px');
    expect(computed(p.button, 'padding-block')).toBe('8px');
    expect(computed(p.button, 'font-size')).toBe('13px');
    expect(computed(p.button, 'line-height')).toBe('1.55');
    expect(computed(p.button, 'border-radius')).toBe('8px');
    expect(computed(p.button, 'min-height')).toBe('38.15px');
    expect(computed(p.small, 'padding-inline')).toBe('10px');
    expect(computed(p.small, 'padding-block')).toBe('6px');
    expect(computed(p.small, 'font-size')).toBe('12px');
    expect(computed(p.input, 'padding-left')).toBe('10px');
    expect(computed(p.input, 'padding-right')).toBe('10px');
    expect(computed(p.input, 'height')).toBe('38.15px');
    expect(computed(p.input, 'font-size')).toBe('13.5px');
    expect(computed(p.input, 'border-radius')).toBe('8px');
    expect(computed(p.label, 'font-size')).toBe('12px');
    expect(computed(p.card, 'border-radius')).toBe('12px');
    expect(computed(p.body, 'padding')).toBe('16px');
    expect(computed(p.head, 'padding-inline')).toBe('16px');
    expect(computed(p.head, 'padding-block')).toBe('12px');
    expect(computed(p.heading, 'font-size')).toBe('17px');
    expect(computed(p.chip, 'padding-inline')).toBe('8px');
    expect(computed(p.chip, 'padding-block')).toBe('2px');
    expect(computed(p.chip, 'gap')).toBe('6px');
    expect(computed(p.chip, 'font-size')).toBe('11.5px');
    expect(computed(p.chip, 'border-radius')).toBe('999px');
  });

  it('follows the spacing scale: --nova-space-* moves every padding built on it', () => {
    const p = parts();
    const scale = {
      '--nova-space-0': '3px',
      '--nova-space-2': '7px',
      '--nova-space-3': '11px',
      '--nova-space-4': '13px',
      '--nova-space-5': '15px',
      '--nova-space-6': '30px',
    };
    expect(computed(p.button, 'padding-inline', scale)).toBe('30px');
    expect(computed(p.button, 'padding-block', scale)).toBe('11px');
    // The height is built on the padding, so it moves with it.
    expect(computed(p.button, 'min-height', scale)).toBe('44.15px');
    expect(computed(p.input, 'height', scale)).toBe('44.15px');
    expect(computed(p.small, 'padding-inline', scale)).toBe('13px');
    expect(computed(p.input, 'padding-left', scale)).toBe('13px');
    expect(computed(p.body, 'padding', scale)).toBe('30px');
    expect(computed(p.head, 'padding-inline', scale)).toBe('30px');
    expect(computed(p.head, 'padding-block', scale)).toBe('15px');
    expect(computed(p.chip, 'padding-inline', scale)).toBe('11px');
    expect(computed(p.chip, 'padding-block', scale)).toBe('3px');
    expect(computed(p.chip, 'gap', scale)).toBe('7px');
  });

  it('follows a component token: one control height and padding for the button and the field', () => {
    const p = parts();
    const control = {
      '--nova-control-h-md': '50px',
      '--nova-control-px-md': '21px',
      '--nova-field-px': '14px',
    };
    expect(computed(p.button, 'min-height', control)).toBe('50px');
    expect(computed(p.input, 'height', control)).toBe('50px');
    expect(computed(p.button, 'padding-inline', control)).toBe('21px');
    expect(computed(p.input, 'padding-left', control)).toBe('14px');
  });

  it('follows the radius scale and the radius roles', () => {
    const p = parts();
    const scale = {
      '--nova-radius-sm': '3px',
      '--nova-radius-md': '9px',
      '--nova-radius-full': '40px',
    };
    expect(computed(p.button, 'border-radius', scale)).toBe('3px');
    expect(computed(p.input, 'border-radius', scale)).toBe('3px');
    expect(computed(p.card, 'border-radius', scale)).toBe('9px');
    expect(computed(p.chip, 'border-radius', scale)).toBe('40px');
    const role = {
      '--nova-radius-control': '5px',
      '--nova-radius-card': '1px',
    };
    expect(computed(p.button, 'border-radius', role)).toBe('5px');
    expect(computed(p.input, 'border-radius', role)).toBe('5px');
    expect(computed(p.card, 'border-radius', role)).toBe('1px');
  });

  it('follows the type roles: size and line height', () => {
    const p = parts();
    const type = {
      '--nova-text-control': '15px',
      '--nova-text-label': '11px',
      '--nova-text-input': '16px',
      '--nova-text-caption': '12px',
      '--nova-text-title': '19px',
      '--nova-leading-body': '2',
    };
    expect(computed(p.button, 'font-size', type)).toBe('15px');
    expect(computed(p.button, 'line-height', type)).toBe('2');
    expect(computed(p.small, 'font-size', type)).toBe('11px');
    expect(computed(p.label, 'font-size', type)).toBe('11px');
    expect(computed(p.input, 'font-size', type)).toBe('16px');
    expect(computed(p.chip, 'font-size', type)).toBe('12px');
    expect(computed(p.heading, 'font-size', type)).toBe('19px');
    // The control height is built on the label's type role too.
    expect(computed(p.button, 'min-height', type)).toBe(
      `${8 * 2 + 15 * 2 + 2}px`,
    );
  });

  it('would catch a component that bypasses the tokens: a scale name or a literal has no style', () => {
    const element = document.createElement('div');
    element.className = 'rounded-md p-4 text-[13px]';
    expect(declared(element)).not.toHaveProperty('border-radius');
    expect(declared(element)).not.toHaveProperty('padding');
    // A literal compiles, but no token moves it.
    expect(
      resolve(declared(element)['font-size'] ?? '', {
        ...rootTokens,
        '--nova-text-control': '15px',
      }),
    ).toBe('13px');
  });
});
