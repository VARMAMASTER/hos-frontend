import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AdmissionsWidgetProps } from './types';

export function AdmissionsWidget({
  patientId,
  compactMode,
  className,
}: AdmissionsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Admissions"
        description="Curated workflow for Admissions."
      />
      <TabContent>
        {/* Curated Inpatient (IPD) - Admissions workflow payload */}
      </TabContent>
    </TabPage>
  );
}
