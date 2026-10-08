import { Card } from '@hos/nova-ui';
import type { ForecastWidgetProps } from './types';

export function ForecastWidget({
  patientId,
  compactMode,
  className,
}: ForecastWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Demand Forecast</h3>
        <p className="text-body text-ink-2">Curated workflow for Demand Forecast.</p>
      </div>
    </Card>
  );
}
