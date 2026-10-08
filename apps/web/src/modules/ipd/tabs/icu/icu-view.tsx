import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { IcuWidgetProps } from './types';

export function IcuWidget({
  patientId,
  compactMode,
  className,
}: IcuWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="ICU & Emergency"
        description="Curated workflow for ICU & Emergency."
      />
      <TabContent>
        {/* Curated Inpatient (IPD) - ICU & Emergency workflow payload */}
      </TabContent>
    </TabPage>
  );
}
