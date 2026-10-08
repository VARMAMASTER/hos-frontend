import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { FamilyWidgetProps } from './types';

export function FamilyWidget({
  patientId,
  compactMode,
  className,
}: FamilyWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Family & Consent"
        description="Curated workflow for Family & Consent."
      />
      <TabContent>
        {/* Curated Patient Records - Family & Consent workflow payload */}
      </TabContent>
    </TabPage>
  );
}
