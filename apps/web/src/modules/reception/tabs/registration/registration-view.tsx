import { Card } from '@hos/nova-ui';
import type { RegistrationWidgetProps } from './types';

export function RegistrationWidget({
  patientId,
  compactMode,
  className,
}: RegistrationWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Registration</h3>
        <p className="text-body text-ink-2">Curated workflow for Registration.</p>
      </div>
    </Card>
  );
}
