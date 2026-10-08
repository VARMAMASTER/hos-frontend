import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { EntryWidgetProps } from './types';

export function EntryWidget({
  patientId,
  compactMode,
  className,
}: EntryWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Result Entry"
        description="Curated workflow for Result Entry."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Result Entry workflow payload */}
      </TabContent>
    </TabPage>
  );
}
