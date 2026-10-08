import { Card } from '@hos/nova-ui';
import type { ProfileWidgetProps } from './types';

export function ProfileWidget({
  patientId,
  compactMode,
  className,
}: ProfileWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Profile</h3>
        <p className="text-body text-ink-2">Curated workflow for Profile.</p>
      </div>
    </Card>
  );
}
