import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Storybook's own chrome (sidebar, toolbar, panels) in Nova's type, so the whole page reads as one
// product: Inter for text and IBM Plex Mono for code, loaded by manager-head.html.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Nova',
    fontBase: '"Inter", system-ui, -apple-system, sans-serif',
    fontCode: '"IBM Plex Mono", ui-monospace, monospace',
  }),
});
