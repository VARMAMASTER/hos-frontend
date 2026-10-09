import { Chip } from '@hos/nova-ui';

// An allergy as words and a mark, never colour alone: a warning triangle and "Allergic: Penicillin".
export function AllergyChip({ allergen }: { allergen: string }) {
  return (
    <Chip tone="crit" icon="⚠" data-allergy={allergen}>
      Allergic: {allergen}
    </Chip>
  );
}
