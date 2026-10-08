import { Card } from '@hos/nova-ui';
import type { CriticalWidgetProps } from './types';

export function CriticalWidget({
  patientId,
  compactMode,
  className,
}: CriticalWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Critical Results</h3>
        <p className="text-body text-ink-2">Curated workflow for Critical Results.</p>
      </div>
    </Card>
  );
}
