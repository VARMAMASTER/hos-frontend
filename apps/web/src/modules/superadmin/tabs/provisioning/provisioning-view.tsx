import { Card } from '@hos/nova-ui';
import type { ProvisioningWidgetProps } from './types';

export function ProvisioningWidget({
  patientId,
  compactMode,
  className,
}: ProvisioningWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Provisioning</h3>
        <p className="text-body text-ink-2">Curated workflow for Provisioning.</p>
      </div>
    </Card>
  );
}
