import * as fs from 'fs';
import * as path from 'path';
import { createJiti } from 'jiti';

const jiti = createJiti(process.cwd());
const { MODULE_REGISTRY } = jiti('./apps/web/src/modules/registry.ts') as {
  MODULE_REGISTRY: Array<{
    id: string;
    title: string;
    category: string;
    icon: string;
    requiredRoles: string[];
    defaultPath: string;
    description: string;
    tabs: Array<{
      id: string;
      label: string;
      path: string;
      icon?: string;
      badge?: string;
    }>;
  }>;
};

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const modulesRoot = path.resolve(process.cwd(), 'apps/web/src/modules');

console.log(
  `Scaffolding ${MODULE_REGISTRY.length} modules in ${modulesRoot}...`,
);

let fileCount = 0;

for (const module of MODULE_REGISTRY) {
  const modDir = path.join(modulesRoot, module.id);
  const tabsDir = path.join(modDir, 'tabs');
  const camelMod = toCamelCase(module.id);
  const pascalMod = toPascalCase(module.id);

  fs.mkdirSync(modDir, { recursive: true });
  fs.mkdirSync(tabsDir, { recursive: true });

  // 1. manifest.ts
  const manifestContent = `import type { ModuleManifest } from '../types';

export const ${camelMod}Manifest: ModuleManifest = ${JSON.stringify(module, null, 2)};

export const manifest = ${camelMod}Manifest;
`;
  fs.writeFileSync(path.join(modDir, 'manifest.ts'), manifestContent, 'utf8');
  fileCount++;

  // 2. tabs/<tab-id>/...
  const tabExports: string[] = [];
  const tabWidgetNames: { tabId: string; widgetName: string; label: string }[] =
    [];

  for (const tab of module.tabs) {
    const tabDir = path.join(tabsDir, tab.id);
    fs.mkdirSync(tabDir, { recursive: true });

    const pascalTab = toPascalCase(tab.id);
    const widgetName = `${pascalTab}Widget`;
    const propsName = `${pascalTab}WidgetProps`;
    tabWidgetNames.push({ tabId: tab.id, widgetName, label: tab.label });
    tabExports.push(`export * from './${tab.id}';`);

    // tabs/<tab-id>/types.ts
    const typesContent = `import type { ComposableWidgetProps } from '../../../types';

export interface ${propsName} extends ComposableWidgetProps {
  // Tab-specific props
}
`;
    fs.writeFileSync(path.join(tabDir, 'types.ts'), typesContent, 'utf8');
    fileCount++;

    // tabs/<tab-id>/<tab-id>-view.tsx
    const viewContent = `import { Card } from '@hos/nova-ui';
import type { ${propsName} } from './types';

export function ${widgetName}({
  patientId,
  compactMode,
  className,
}: ${propsName}) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">${tab.label}</h3>
        <p className="text-body text-ink-2">Curated workflow for ${tab.label}.</p>
      </div>
    </Card>
  );
}
`;
    fs.writeFileSync(
      path.join(tabDir, `${tab.id}-view.tsx`),
      viewContent,
      'utf8',
    );
    fileCount++;

    // tabs/<tab-id>/index.ts
    const tabIndexContent = `export * from './types';
export * from './${tab.id}-view';
`;
    fs.writeFileSync(path.join(tabDir, 'index.ts'), tabIndexContent, 'utf8');
    fileCount++;
  }

  // 3. tabs/index.ts
  const tabsIndexContent = `${tabExports.join('\n')}\n`;
  fs.writeFileSync(path.join(tabsDir, 'index.ts'), tabsIndexContent, 'utf8');
  fileCount++;

  // 4. routes.tsx
  const tabImports = tabWidgetNames.map((t) => `  ${t.widgetName},`).join('\n');
  const defaultTab =
    module.tabs.find((t) => t.path === module.defaultPath) || module.tabs[0];
  const defaultWidgetName = `${toPascalCase(defaultTab.id)}Widget`;

  const routeChildren = tabWidgetNames
    .map(
      (t) => `      {
        path: '${t.tabId}',
        element: <${t.widgetName} />,
      },`,
    )
    .join('\n');

  const routesContent = `import type { RouteObject } from '../types';
import {
${tabImports}
} from './tabs';

export const ${camelMod}Routes: RouteObject[] = [
  {
    path: '/${module.id}',
    children: [
      {
        index: true,
        element: <${defaultWidgetName} />,
      },
${routeChildren}
    ],
  },
];

export const routes = ${camelMod}Routes;
`;
  fs.writeFileSync(path.join(modDir, 'routes.tsx'), routesContent, 'utf8');
  fileCount++;

  // 5. index.ts
  const indexContent = `export * from './manifest';
export * from './routes';
export * from './tabs';
`;
  fs.writeFileSync(path.join(modDir, 'index.ts'), indexContent, 'utf8');
  fileCount++;

  // 6. README.md
  const tabTableRows = module.tabs
    .map(
      (t) =>
        `| \`${t.id}\` | ${t.label} | \`${t.path}\` | ${t.badge ? `\`${t.badge}\`` : '—'} | \`<${toPascalCase(t.id)}Widget />\` |`,
    )
    .join('\n');

  const readmeContent = `# ${module.title} (\`${module.id}\`)

**Category:** \`${module.category}\`  
**Icon:** \`${module.icon}\`  
**Default Path:** \`${module.defaultPath}\`  
**Required Roles:** \`${module.requiredRoles.join(', ')}\`  

## Description
${module.description}

## Tab Catalog
| Tab ID | Label | Route Path | Badge | Widget Component |
| --- | --- | --- | --- | --- |
${tabTableRows}

## Architecture & Composable Widget Contract
All tabs within this module are organized under the tab-as-a-folder architecture:
- \`tabs/<tab-id>/types.ts\`: Props interface extending \`ComposableWidgetProps\`
- \`tabs/<tab-id>/<tab-id>-view.tsx\`: Embeddable composable widget component
- \`tabs/<tab-id>/index.ts\`: Tab barrel export
- \`tabs/index.ts\`: Aggregator barrel exporting all tab widgets

## Curation Checklist
- [ ] Responsive layout adhering to Nova UI tokens
- [ ] Role-based access control and tenant entitlement checks
- [ ] Live updates / token queue subscriptions where applicable
- [ ] Error boundary & loading skeletons implemented
- [ ] Zero deep cross-module imports (strict architectural boundary)
`;
  fs.writeFileSync(path.join(modDir, 'README.md'), readmeContent, 'utf8');
  fileCount++;
}

console.log(
  `Scaffolding complete: Created ${fileCount} files across ${MODULE_REGISTRY.length} modules.`,
);
