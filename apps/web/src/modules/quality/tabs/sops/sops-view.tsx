import { Card } from '@hos/nova-ui';
import type { SopsWidgetProps } from './types';

export function SopsWidget({
  patientId,
  compactMode,
  className,
}: SopsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">SOP Library</h3>
        <p className="text-body text-ink-2">Curated workflow for SOP Library.</p>
      </div>
    </Card>
  );
}
