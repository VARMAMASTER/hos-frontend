import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AskWidgetProps } from './types';

export function AskWidget({
  patientId,
  compactMode,
  className,
}: AskWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Ask Anything"
        description="Curated workflow for Ask Anything."
      />
      <TabContent>
        {/* Curated Analytics & Insights - Ask Anything workflow payload */}
      </TabContent>
    </TabPage>
  );
}
