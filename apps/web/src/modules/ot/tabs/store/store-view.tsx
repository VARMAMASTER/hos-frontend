import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { StoreWidgetProps } from './types';

export function StoreWidget({
  patientId,
  compactMode,
  className,
}: StoreWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Theatre Store"
        description="Curated workflow for Theatre Store."
      />
      <TabContent>
        {/* Curated Operation Theatre - Theatre Store workflow payload */}
      </TabContent>
    </TabPage>
  );
}
