import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ComposerWidgetProps } from './types';

export function ComposerWidget({
  patientId,
  compactMode,
  className,
}: ComposerWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Bill Composer"
        description="Curated workflow for Bill Composer."
      />
      <TabContent>
        {/* Curated Billing & Cashier - Bill Composer workflow payload */}
      </TabContent>
    </TabPage>
  );
}
