import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {
      builder: {
        viteConfigPath: 'vite.config.mts',
      },
    },
  },
  // Storybook reuses the library's vite.config.mts, including its declaration build (vite:dts).
  // That belongs to `nx build`; left in, it writes ~20 .d.ts files into the static Storybook.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: viteConfig.plugins?.filter(
      (plugin) => !(plugin && 'name' in plugin && plugin.name === 'vite:dts'),
    ),
  }),
};

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

export default config;
