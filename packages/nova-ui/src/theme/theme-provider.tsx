import type { CSSProperties, ReactNode } from 'react';
import type { NovaMaterial } from '../tokens/material';
import type { NovaScheme } from '../tokens/scheme';
import { NOVA_FONTS, type NovaFontPreset } from '../tokens/semantic';
import {
  NOVA_THEME_VARIABLES,
  supportsLightDark,
  themeVariables,
  type NovaTheme,
} from './create-theme';

export interface NovaThemeProviderProps {
  theme?: NovaTheme;
  // The product-wide material for this subtree; a hospital theme's own material wins over it.
  // Unset everywhere means the CSS default, glass.
  material?: NovaMaterial;
  // light, dark, or system (follows prefers-color-scheme). Independent of the theme and the material;
  // unset everywhere means the CSS default, light.
  scheme?: NovaScheme;
  // The font preset for this subtree: googleSans, ibmPlexSans, or ibmPlexMono.
  font?: NovaFontPreset;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

// Subtree-scoped. Dialog portals into the nearest themed root, so it keeps this theme; other content
// portalled to <body> escapes it. For an app-wide tenant theme use applyNovaTheme.
export function NovaThemeProvider({
  theme,
  material,
  scheme,
  font,
  style,
  className,
  children,
}: NovaThemeProviderProps) {
  const fontStyle =
    font && font in NOVA_FONTS
      ? ({
          '--nova-font-body': NOVA_FONTS[font],
          '--nova-font-display': NOVA_FONTS[font],
        } as CSSProperties)
      : undefined;

  return (
    <div
      data-nova-theme={theme?.name ?? 'default'}
      data-nova-material={theme?.material ?? material}
      data-nova-scheme={scheme}
      data-nova-font={font}
      className={className}
      // Through the allow-list: a theme that skipped createNovaTheme still sets no status or AI token.
      style={{
        ...(themeVariables(theme, {
          lightDark: supportsLightDark(),
        }) as CSSProperties),
        ...fontStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function applyNovaTheme(
  theme: NovaTheme,
  element: HTMLElement = document.documentElement,
): () => void {
  // Every allow-listed key is written or cleared, so a theme applied over another (a tenant switch
  // without the first cleanup) keeps nothing of the first, and nothing outside the list is touched.
  const variables = themeVariables(theme, { lightDark: supportsLightDark() });
  const previous = new Map<string, string>();
  for (const name of NOVA_THEME_VARIABLES) {
    previous.set(name, element.style.getPropertyValue(name));
    const value = variables[name];
    if (value === undefined) element.style.removeProperty(name);
    else element.style.setProperty(name, value);
  }
  const previousName = element.dataset['novaTheme'];
  element.dataset['novaTheme'] = theme.name;
  const restoreMaterial =
    theme.material === undefined
      ? undefined
      : applyNovaMaterial(theme.material, element);

  return () => {
    for (const [name, value] of previous) {
      if (value) element.style.setProperty(name, value);
      else element.style.removeProperty(name);
    }
    if (previousName === undefined) delete element.dataset['novaTheme'];
    else element.dataset['novaTheme'] = previousName;
    restoreMaterial?.();
  };
}

function applyAttribute(
  element: HTMLElement,
  key: 'novaMaterial' | 'novaScheme',
  value: string,
): () => void {
  const previous = element.dataset[key];
  element.dataset[key] = value;
  return () => {
    if (previous === undefined) delete element.dataset[key];
    else element.dataset[key] = previous;
  };
}

// Switches the material for everything under `element` (the whole product by default).
export function applyNovaMaterial(
  material: NovaMaterial,
  element: HTMLElement = document.documentElement,
): () => void {
  return applyAttribute(element, 'novaMaterial', material);
}

// Switches the scheme for everything under `element` (the whole product by default): the user's
// light / dark / system preference. `system` follows prefers-color-scheme live, with no listener:
// the CSS does it (color-scheme: light dark).
export function applyNovaScheme(
  scheme: NovaScheme,
  element: HTMLElement = document.documentElement,
): () => void {
  return applyAttribute(element, 'novaScheme', scheme);
}
