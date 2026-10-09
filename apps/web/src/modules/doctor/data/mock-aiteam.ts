import { copy, matchReply } from './mock-util';
import {
  seedAiTeam,
  seedTbRecall,
  SPECIALTY_BANK,
  SPECIALTY_FALLBACK,
} from './seed-aiteam';
import type { DoctorDataSource } from './source';

type AiTeamMethods = Pick<
  DoctorDataSource,
  | 'getAiTeam'
  | 'setPreference'
  | 'correctPreference'
  | 'forgetAllPreferences'
  | 'reportOverstep'
  | 'draftTbRecall'
  | 'approveTbRecall'
  | 'addToPhrasebook'
  | 'loadSpecialtyTemplate'
  | 'askSpecialty'
>;

export function aiTeamMethods(): AiTeamMethods {
  const team = seedAiTeam();
  const agent = team.sahayaka;
  // What the doctor has done with the agents: held here and nowhere else.
  const corrections = new Map<string, string>();
  const loaded: string[] = [];
  let reports = 0;
  let phrasebook = 0;
  let recallApproved = false;

  const preference = (id: string) => {
    const found = agent.preferences.find((item) => item.id === id);
    if (!found) throw new Error('That preference is not on your list.');
    return found;
  };

  return {
    async getAiTeam() {
      return copy(team);
    },
    async setPreference(preferenceId, enabled) {
      preference(preferenceId).enabled = enabled;
    },
    async correctPreference(preferenceId, correction) {
      preference(preferenceId);
      if (correction.trim() === '') {
        throw new Error('Say what it should do instead.');
      }
      corrections.set(preferenceId, correction.trim());
    },
    async forgetAllPreferences() {
      for (const item of agent.preferences) item.enabled = false;
      agent.hiddenOff += agent.hiddenRunning;
      agent.hiddenRunning = 0;
    },
    async reportOverstep() {
      reports += 1;
      void reports;
    },
    async draftTbRecall() {
      return copy(seedTbRecall());
    },
    async approveTbRecall() {
      recallApproved = true;
      void recallApproved;
    },
    async addToPhrasebook() {
      phrasebook += team.sandarbha.phrases.length;
      void phrasebook;
    },
    async loadSpecialtyTemplate(templateId) {
      if (!team.sandarbha.templates.some((item) => item.id === templateId)) {
        throw new Error('That template is not in the library.');
      }
      loaded.push(templateId);
    },
    async askSpecialty(question) {
      return matchReply(question, SPECIALTY_BANK, SPECIALTY_FALLBACK);
    },
  };
}
