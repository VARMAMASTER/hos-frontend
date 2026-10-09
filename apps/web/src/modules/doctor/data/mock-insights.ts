import { copy } from './mock-util';
import { seedInsightsOverview, seedInsightsResult } from './seed-insights';
import type { DoctorDataSource } from './source';

type InsightsMethods = Pick<
  DoctorDataSource,
  'getInsights' | 'analyzeInsights' | 'actOnInsight' | 'dismissInsight'
>;

export function insightsMethods(): InsightsMethods {
  const insights = seedInsightsResult().insights;
  // What the doctor did with each insight: held here and nowhere else.
  const acted: string[] = [];
  const dismissed = new Map<string, string>();
  const find = (insightId: string) => {
    const found = insights.find((item) => item.id === insightId);
    if (!found) throw new Error('That insight is not on your list.');
    return found;
  };

  return {
    async getInsights() {
      return copy(seedInsightsOverview());
    },
    async analyzeInsights() {
      return copy(seedInsightsResult());
    },
    async actOnInsight(insightId, actionId) {
      const insight = find(insightId);
      const offered = [insight.action, insight.secondary].filter(Boolean);
      if (!offered.some((action) => action?.id === actionId)) {
        throw new Error('That action is not on this insight.');
      }
      acted.push(`${insightId}:${actionId}`);
    },
    async dismissInsight(insightId, reason) {
      find(insightId);
      if (reason.trim() === '') {
        throw new Error('Say why you are dismissing this insight.');
      }
      dismissed.set(insightId, reason.trim());
    },
  };
}
