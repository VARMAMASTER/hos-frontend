import nx from '@nx/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';

// The raw elements a module or the app shell never writes: Nova's layout and type components draw
// them on tokens (AGENTS.md, "The UI is Nova only").
const NOVA_ONLY_ELEMENTS = [
  {
    element: 'div',
    message:
      'Use <Box>, <Stack>, or <TabPage> from @hos/nova-ui instead of raw <div>.',
  },
  {
    element: 'p',
    message: 'Use <Text> from @hos/nova-ui instead of raw <p>.',
  },
  {
    element: 'span',
    message: 'Use <Text as="span"> from @hos/nova-ui instead of raw <span>.',
  },
  {
    element: 'h1',
    message: 'Use <Heading level="h1"> from @hos/nova-ui.',
  },
  {
    element: 'h2',
    message: 'Use <Heading level="h2"> from @hos/nova-ui.',
  },
  {
    element: 'h3',
    message: 'Use <Heading level="h3"> from @hos/nova-ui.',
  },
  {
    element: 'h4',
    message: 'Use <Heading level="h4"> from @hos/nova-ui.',
  },
  {
    element: 'h5',
    message: 'Use <Heading level="h5"> from @hos/nova-ui.',
  },
  {
    element: 'h6',
    message: 'Use <Heading level="h6"> from @hos/nova-ui.',
  },
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/storybook-static',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    files: [
      'apps/web/src/modules/**/*.ts',
      'apps/web/src/modules/**/*.tsx',
      'src/modules/**/*.ts',
      'src/modules/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/modules/*/tabs/*',
                '@/modules/*/tabs/*/**',
                '../*/tabs/*',
                '../*/tabs/*/**',
                '../../*/tabs/*',
                '../../*/tabs/*/**',
              ],
              message:
                'Cross-module deep imports are forbidden. Import from the root @/modules/<name> barrel instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/modules/**/*.tsx', 'src/modules/**/*.tsx'],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/forbid-elements': ['error', { forbid: NOVA_ONLY_ELEMENTS }],
    },
  },
  // The app shell is held to the same rule as the modules, and takes Nova's Button too.
  {
    files: [
      'apps/web/src/app/**/*.tsx',
      'apps/web/src/main.tsx',
      'src/app/**/*.tsx',
      'src/main.tsx',
    ],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/forbid-elements': [
        'error',
        {
          forbid: [
            ...NOVA_ONLY_ELEMENTS,
            {
              element: 'button',
              message:
                'Use <Button> from @hos/nova-ui instead of raw <button>.',
            },
          ],
        },
      ],
    },
  },
];
