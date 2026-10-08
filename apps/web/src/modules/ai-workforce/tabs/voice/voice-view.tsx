import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { VoiceWidgetProps } from './types';

export function VoiceWidget({
  patientId,
  compactMode,
  className,
}: VoiceWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Voice Assistant"
        description="Curated workflow for Voice Assistant."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - Voice Assistant workflow payload */}
      </TabContent>
    </TabPage>
  );
}
