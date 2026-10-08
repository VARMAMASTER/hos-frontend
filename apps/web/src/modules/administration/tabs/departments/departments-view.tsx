import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DepartmentsWidgetProps } from './types';

export function DepartmentsWidget({
  patientId,
  compactMode,
  className,
}: DepartmentsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Departments"
        description="Curated workflow for Departments."
      />
      <TabContent>
        {/* Curated Administration - Departments workflow payload */}
      </TabContent>
    </TabPage>
  );
}
