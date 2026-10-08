import { Card } from '@hos/nova-ui';
import type { RegistersWidgetProps } from './types';

export function RegistersWidget({
  patientId,
  compactMode,
  className,
}: RegistersWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Statutory Registers</h3>
        <p className="text-body text-ink-2">Curated workflow for Statutory Registers.</p>
      </div>
    </Card>
  );
}
