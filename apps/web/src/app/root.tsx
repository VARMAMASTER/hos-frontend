import { useState } from 'react';
import {
  NovaThemeProvider,
  type NovaFontPreset,
  type NovaMaterial,
  type NovaScheme,
  type NovaTheme,
} from '@hos/nova-ui';
import { App, type AppProps } from './app';

export interface RootProps extends Omit<AppProps, 'font' | 'onFontChange'> {
  // The hospital's theme, the scheme and the material: set here, in one place, for the whole app
  // (BLUEPRINT §10 step 4). Unset, each is the CSS default (HOS Violet, light, glass).
  theme?: NovaTheme;
  scheme?: NovaScheme;
  material?: NovaMaterial;
  // The font the app opens in; the switcher in the top bar changes it from there.
  initialFont?: NovaFontPreset;
}

// The app inside one NovaThemeProvider, so the sidebar, the top bar, the page and every module take
// their theme, scheme, material and font from the same root. font-sans re-reads the provider's
// --nova-font-body, so body text follows the font as display type does.
export function Root({
  theme,
  scheme,
  material,
  initialFont = 'googleSans',
  ...app
}: RootProps) {
  const [font, setFont] = useState<NovaFontPreset>(initialFont);
  return (
    <NovaThemeProvider
      theme={theme}
      scheme={scheme}
      material={material}
      font={font}
      className="min-h-screen font-sans text-ink"
    >
      <App {...app} font={font} onFontChange={setFont} />
    </NovaThemeProvider>
  );
}
