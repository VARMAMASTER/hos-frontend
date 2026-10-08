import { Card } from '@hos/nova-ui';
import type { TenantsWidgetProps } from './types';

export function TenantsWidget({
  patientId,
  compactMode,
  className,
}: TenantsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Tenants</h3>
        <p className="text-body text-ink-2">Curated workflow for Tenants.</p>
      </div>
    </Card>
  );
}
