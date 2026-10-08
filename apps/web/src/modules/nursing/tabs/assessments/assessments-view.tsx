import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AssessmentsWidgetProps } from './types';

export function AssessmentsWidget({
  patientId,
  compactMode,
  className,
}: AssessmentsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Assessments"
        description="Curated workflow for Assessments."
      />
      <TabContent>
        {/* Curated Ward Nursing - Assessments workflow payload */}
      </TabContent>
    </TabPage>
  );
}
