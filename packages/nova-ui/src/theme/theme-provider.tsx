import type { CSSProperties, ReactNode } from 'react';
import type { NovaTheme } from './create-theme';

export interface NovaThemeProviderProps {
  theme?: NovaTheme;
  className?: string;
  children: ReactNode;
}

// Subtree-scoped: content portalled to <body> escapes it. For an app-wide tenant theme use applyNovaTheme.
export function NovaThemeProvider({
  theme,
  className,
  children,
}: NovaThemeProviderProps) {
  return (
    <div
      data-nova-theme={theme?.name ?? 'default'}
      className={className}
      style={theme?.cssVariables as CSSProperties | undefined}
    >
      {children}
    </div>
  );
}

export function applyNovaTheme(
  theme: NovaTheme,
  element: HTMLElement = document.documentElement,
): () => void {
  const previous = new Map<string, string>();
  for (const [name, value] of Object.entries(theme.cssVariables)) {
    if (value === undefined) continue;
    previous.set(name, element.style.getPropertyValue(name));
    element.style.setProperty(name, value);
  }
  const previousName = element.dataset['novaTheme'];
  element.dataset['novaTheme'] = theme.name;

  return () => {
    for (const [name, value] of previous) {
      if (value) element.style.setProperty(name, value);
      else element.style.removeProperty(name);
    }
    if (previousName === undefined) delete element.dataset['novaTheme'];
    else element.dataset['novaTheme'] = previousName;
  };
}
