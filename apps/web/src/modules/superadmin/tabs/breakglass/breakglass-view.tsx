import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { BreakglassWidgetProps } from './types';

export function BreakglassWidget({
  patientId,
  compactMode,
  className,
}: BreakglassWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Break-glass Log"
        description="Curated workflow for Break-glass Log."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Break-glass Log workflow payload */}
      </TabContent>
    </TabPage>
  );
}
