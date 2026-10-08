import { Card } from '@hos/nova-ui';
import type { ReferralsWidgetProps } from './types';

export function ReferralsWidget({
  patientId,
  compactMode,
  className,
}: ReferralsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Referrals Out</h3>
        <p className="text-body text-ink-2">Curated workflow for Referrals Out.</p>
      </div>
    </Card>
  );
}
