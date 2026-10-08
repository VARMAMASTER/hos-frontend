import { Card } from '@hos/nova-ui';
import type { SupportWidgetProps } from './types';

export function SupportWidget({
  patientId,
  compactMode,
  className,
}: SupportWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Tickets & Issues</h3>
        <p className="text-body text-ink-2">Curated workflow for Tickets & Issues.</p>
      </div>
    </Card>
  );
}
