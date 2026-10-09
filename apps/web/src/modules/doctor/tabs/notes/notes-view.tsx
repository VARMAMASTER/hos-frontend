import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { NotesWidgetProps } from './types';

export function NotesWidget({
  patientId,
  compactMode,
  className,
}: NotesWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Progress Notes"
        description="Curated workflow for Progress Notes."
      />
      <TabContent>
        {/* Curated Doctor module - Progress Notes workflow payload */}
      </TabContent>
    </TabPage>
  );
}
