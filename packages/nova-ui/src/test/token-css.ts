// Test-only (never in the library build): the compiled token layer, resolved the way a browser would.
// Each element's classes are compiled by Tailwind against theme.css (which defines nothing but the
// token layer), the element's utility rules are taken in stylesheet order, every var() chain is
// followed through theme.css's :root tokens and calc() is worked out. jsdom computes no custom
// properties and no cascade from a stylesheet, so this is a browser-less resolution of the compiled
// CSS, shared by token-reach.spec.tsx and consistency.spec.tsx.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';

// A path, not new URL(…): under jsdom, URL resolves against the page's origin, not the file.
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(join(srcDir, 'styles/theme.css'), 'utf8');
const requireFrom = createRequire(import.meta.url);
const tailwindDir = dirname(requireFrom.resolve('tailwindcss/package.json'));
const compiler = await compile(`@import 'tailwindcss';\n${themeCss}`, {
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
export const rootTokens = Object.fromEntries(
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
export function declared(element: Element): Record<string, string> {
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
export function resolve(value: string, tokens: Record<string, string>): string {
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

export function computed(
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
