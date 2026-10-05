import type { CSSProperties, ReactNode } from 'react';
import type { NovaMaterial } from '../tokens/material';
import {
  NOVA_THEME_VARIABLES,
  themeVariables,
  type NovaTheme,
} from './create-theme';

export interface NovaThemeProviderProps {
  theme?: NovaTheme;
  // The product-wide material for this subtree; a hospital theme's own material wins over it.
  // Unset everywhere means the CSS default, glass.
  material?: NovaMaterial;
  className?: string;
  children: ReactNode;
}

// Subtree-scoped. Dialog portals into the nearest themed root, so it keeps this theme; other content
// portalled to <body> escapes it. For an app-wide tenant theme use applyNovaTheme.
export function NovaThemeProvider({
  theme,
  material,
  className,
  children,
}: NovaThemeProviderProps) {
  return (
    <div
      data-nova-theme={theme?.name ?? 'default'}
      data-nova-material={theme?.material ?? material}
      className={className}
      // Through the allow-list: a theme that skipped createNovaTheme still sets no status or AI token.
      style={themeVariables(theme) as CSSProperties}
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
  const variables = themeVariables(theme);
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

// Switches the material for everything under `element` (the whole product by default).
export function applyNovaMaterial(
  material: NovaMaterial,
  element: HTMLElement = document.documentElement,
): () => void {
  const previous = element.dataset['novaMaterial'];
  element.dataset['novaMaterial'] = material;
  return () => {
    if (previous === undefined) delete element.dataset['novaMaterial'];
    else element.dataset['novaMaterial'] = previous;
  };
}
