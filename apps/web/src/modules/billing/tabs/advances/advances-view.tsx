import { Card } from '@hos/nova-ui';
import type { AdvancesWidgetProps } from './types';

export function AdvancesWidget({
  patientId,
  compactMode,
  className,
}: AdvancesWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Advances & Packages</h3>
        <p className="text-body text-ink-2">Curated workflow for Advances & Packages.</p>
      </div>
    </Card>
  );
}
