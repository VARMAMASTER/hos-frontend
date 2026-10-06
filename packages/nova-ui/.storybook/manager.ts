import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Storybook's own chrome (sidebar, toolbar, panels) in Nova's type, so the whole page reads as one
// product: Google Sans Flex for text, as in the HOS prototype, and IBM Plex Mono for code, both
// loaded by manager-head.html with the prototype's Google Fonts URL.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Nova',
    fontBase: '"Google Sans Flex", system-ui, -apple-system, sans-serif',
    fontCode: '"IBM Plex Mono", ui-monospace, monospace',
  }),
});
