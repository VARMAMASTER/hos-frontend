import { chartIsOpen, copy, matchReply, type MockState } from './mock-util';
import {
  LENS_ACTIONS,
  PANEL_BANK,
  PANEL_FALLBACK,
  seedDiscussion,
  seedPanel,
} from './seed-discuss';
import type { DoctorDataSource } from './source';

type DiscussMethods = Pick<
  DoctorDataSource,
  | 'getDiscussion'
  | 'convenePanel'
  | 'runLensAction'
  | 'approveLensDraft'
  | 'approveReviewNote'
  | 'askPanel'
>;

export function discussMethods(state: MockState): DiscussMethods {
  // What the doctor approved: held here and nowhere else. The mock writes nothing to a chart and
  // sends nothing to a lab, a patient or another hospital.
  const approvedDrafts = new Set<string>();
  let reviewNoteApproved = false;
  const find = (lensId: string, actionId: string) => {
    const spec = LENS_ACTIONS[`${lensId}:${actionId}`];
    if (!spec) throw new Error('That action is not on this lens.');
    return spec.result;
  };

  return {
    async getDiscussion() {
      return chartIsOpen(state) ? copy(seedDiscussion()) : null;
    },
    async convenePanel() {
      return copy(seedPanel());
    },
    async runLensAction(lensId, actionId) {
      return copy(find(lensId, actionId));
    },
    async approveLensDraft(lensId, actionId) {
      if (!find(lensId, actionId).draft) {
        throw new Error('That action has no draft to approve.');
      }
      approvedDrafts.add(`${lensId}:${actionId}`);
    },
    async approveReviewNote() {
      reviewNoteApproved = true;
      void reviewNoteApproved;
    },
    async askPanel(question) {
      return matchReply(question, PANEL_BANK, PANEL_FALLBACK);
    },
  };
}
