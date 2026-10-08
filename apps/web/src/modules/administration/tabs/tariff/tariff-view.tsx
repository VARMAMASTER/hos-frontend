import { Card } from '@hos/nova-ui';
import type { TariffWidgetProps } from './types';

export function TariffWidget({
  patientId,
  compactMode,
  className,
}: TariffWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Tariff Master</h3>
        <p className="text-body text-ink-2">Curated workflow for Tariff Master.</p>
      </div>
    </Card>
  );
}
