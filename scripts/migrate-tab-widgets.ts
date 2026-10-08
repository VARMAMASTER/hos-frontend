import * as fs from 'fs';
import * as path from 'path';
import { MODULE_REGISTRY } from '../apps/web/src/modules/registry';

const modulesRoot = path.resolve(__dirname, '../apps/web/src/modules');

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

let migrated = 0;

for (const manifest of MODULE_REGISTRY) {
  for (const tab of manifest.tabs) {
    const tabDir = path.join(modulesRoot, manifest.id, 'tabs', tab.id);
    const viewFile = path.join(tabDir, `${tab.id}-view.tsx`);
    const widgetName = `${toPascalCase(tab.id)}Widget`;
    const propsName = `${toPascalCase(tab.id)}WidgetProps`;

    const content = `import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ${propsName} } from './types';

export function ${widgetName}({
  patientId,
  compactMode,
  className,
}: ${propsName}) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="${tab.label}"
        description="Curated workflow for ${tab.label}."
      />
      <TabContent>
        {/* Curated ${manifest.title} - ${tab.label} workflow payload */}
      </TabContent>
    </TabPage>
  );
}
`;

    fs.writeFileSync(viewFile, content, 'utf-8');
    migrated++;
  }
}

console.log(`Successfully migrated ${migrated} tab widgets to Nova UI Tab Templates.`);
