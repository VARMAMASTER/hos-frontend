import type { AdmissionRequest } from '../../data';
import { rupee } from './money';

// The warning nobody gives at admission (the prototype's #admPropWarn). A room above the policy's
// sub-limit does not only cap the room: most Indian indemnity policies then reduce every associated
// charge in the same ratio (eligible / actual rent). The figures are worked out from the estimate on
// screen, not asserted, so the warning can never disagree with it.

export interface ProportionateDeduction {
  title: string;
  body: string;
  // The working, one line each.
  working: string[];
}

export function proportionateDeduction(
  bed: AdmissionRequest['bed'],
  ratePerNight: number,
): ProportionateDeduction | null {
  const {
    subLimitPerDay,
    nights,
    estimateTotal,
    nonPayable,
    pharmacy,
    baseRatePerNight,
  } = bed;
  if (!ratePerNight || ratePerNight <= subLimitPerDay) return null;

  const room = ratePerNight * nights;
  const eligibleRoom = subLimitPerDay * nights;
  const excess = room - eligibleRoom;
  const associated = estimateTotal - room - nonPayable - pharmacy;
  const ratio = subLimitPerDay / ratePerNight;
  const allowed = Math.round(associated * ratio);
  const reduction = associated - allowed;
  const upgrade = room - baseRatePerNight * nights;
  const percent = `${(ratio * 100).toFixed(2)}%`;

  return {
    title: `This bed is ${rupee(ratePerNight - subLimitPerDay)} a night above his room-rent sub-limit`,
    body:
      `His policy caps room rent at ${rupee(subLimitPerDay)} a day. This bed is ${rupee(ratePerNight)} a night, ` +
      `so Star Health will apply a proportionate deduction — reducing not just the room but every associated ` +
      `charge in the same ratio: surgeon, theatre, anaesthesia, nursing and investigations. On this estimate ` +
      `that is ${rupee(excess)} of room excess plus ${rupee(reduction)} of proportionate reduction. ` +
      `A ${rupee(upgrade)} upgrade adds ${rupee(excess + reduction)} to what the insurer will not pay.`,
    working: [
      `eligible ${rupee(subLimitPerDay)} ÷ actual ${rupee(ratePerNight)} = ${percent} allowed`,
      `associated charges ${rupee(associated)} × ${percent} = ${rupee(allowed)} allowed`,
      `proportionate deduction = ${rupee(reduction)}`,
    ],
  };
}
