import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ScribeWidgetProps } from './types';

export function ScribeWidget({
  patientId,
  compactMode,
  className,
}: ScribeWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="AI Scribe"
        description="Curated workflow for AI Scribe."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - AI Scribe workflow payload */}
      </TabContent>
    </TabPage>
  );
}
