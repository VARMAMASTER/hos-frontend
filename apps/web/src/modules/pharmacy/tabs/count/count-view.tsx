import { Card } from '@hos/nova-ui';
import type { CountWidgetProps } from './types';

export function CountWidget({
  patientId,
  compactMode,
  className,
}: CountWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Count & Variance</h3>
        <p className="text-body text-ink-2">Curated workflow for Count & Variance.</p>
      </div>
    </Card>
  );
}
