import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AnalyzerWidgetProps } from './types';

export function AnalyzerWidget({
  patientId,
  compactMode,
  className,
}: AnalyzerWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Analyser Interface"
        description="Curated workflow for Analyser Interface."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Analyser Interface workflow payload */}
      </TabContent>
    </TabPage>
  );
}
