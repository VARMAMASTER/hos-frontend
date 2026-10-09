import { useState } from 'react';
import { Avatar, Button, Chip, Dialog, Stack, Text } from '@hos/nova-ui';
import type { FamilyLink, LinkInvite } from '../../data';
import { usePatientRecord, usePatientRecordAction } from '../../data';
import { ActionFeedback, Section, type ActionNotice } from '../../ui';
import { LinkDialog } from './link-dialog';

export interface LinksSectionProps {
  links: FamilyLink[];
  patientId: string;
  patientName: string;
  readonly?: boolean;
  onLinked: (link: FamilyLink) => void;
}

function lower(category: string): string {
  return category.startsWith('OPD')
    ? category
    : category.charAt(0).toLowerCase() + category.slice(1);
}

function sentence(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function accessLine(link: FamilyLink): string {
  if (link.status === 'invited') {
    return `Cannot view anything until they confirm consent. Invitation sent ${link.statusDate}.`;
  }
  const allowed = link.access
    .filter((g) => g.allowed)
    .map((g) => lower(g.category));
  return `Can view ${sentence(allowed)} via the HOS patient app — access granted ${link.statusDate}.`;
}

// Linked family accounts: who else may see her records through the HOS patient app, and exactly
// what. An invitation grants nothing until they confirm consent themselves.
export function LinksSection({
  links,
  patientId,
  patientName,
  readonly = false,
  onLinked,
}: LinksSectionProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [detail, setDetail] = useState<FamilyLink | null>(null);
  const [linking, setLinking] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  async function send(invite: LinkInvite) {
    const link = await action.run(() =>
      source.requestFamilyLink(invite, patientId),
    );
    if (!link) return;
    onLinked(link);
    setLinking(false);
    setNotice({
      title: `Invitation sent to ${link.name}`,
      detail: 'Nothing is shared until they confirm consent.',
    });
  }

  return (
    <>
      <Stack gap="s4">
        <ActionFeedback
          notice={notice}
          error={null}
          onDismissNotice={() => setNotice(null)}
        />
        <Section
          title="Linked family accounts"
          actions={
            <Text as="span" size="sm" tone="muted">
              {`${links.length} linked`}
            </Text>
          }
        >
          <Stack gap="s6">
            {links.length === 0 ? (
              <Text tone="muted">No family accounts linked yet.</Text>
            ) : (
              <Stack as="ul" gap="s6">
                {links.map((link) => (
                  <li key={link.id}>
                    <Stack direction="horizontal" align="start" gap="s4">
                      <Avatar name={link.name} />
                      <Stack gap="s1" className="min-w-0 flex-1">
                        <Stack
                          direction="horizontal"
                          align="center"
                          wrap
                          gap="s3"
                        >
                          <Text as="span" weight="semibold">
                            {link.name}
                          </Text>
                          {link.status === 'linked' ? (
                            <Chip tone="good" icon="✓">
                              Linked account
                            </Chip>
                          ) : (
                            <Chip tone="info">
                              Invitation sent · awaiting acceptance
                            </Chip>
                          )}
                        </Stack>
                        <Text size="sm" tone="muted">
                          {`${link.relation} · ${link.phone}${link.abha ? ` · ABHA ${link.abha}` : ''}`}
                        </Text>
                        <Text size="sm" tone="muted">
                          {accessLine(link)}
                        </Text>
                      </Stack>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Access details for ${link.name}`}
                        onClick={() => setDetail(link)}
                      >
                        Access details
                      </Button>
                    </Stack>
                  </li>
                ))}
              </Stack>
            )}
            {readonly ? null : (
              <Stack direction="horizontal" gap="s2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    action.clearError();
                    setLinking(true);
                  }}
                >
                  Link a family member
                </Button>
              </Stack>
            )}
          </Stack>
        </Section>
      </Stack>

      <Dialog
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={
          detail
            ? `${detail.name} — ${detail.status === 'linked' ? 'linked access' : 'invitation'}`
            : ''
        }
        description={
          detail
            ? `${detail.name} (${detail.relation.toLowerCase()}) ${detail.status === 'linked' ? 'can view' : 'will be able to view, once they accept,'} ${patientName}’s records via the HOS patient app.`
            : undefined
        }
      >
        {detail ? (
          <Stack gap="s4">
            <Stack as="ul" gap="s2">
              {detail.access.map((grant) => (
                <li key={grant.category}>
                  {`${grant.category} — ${grant.allowed ? 'allowed' : 'not allowed yet'}`}
                </li>
              ))}
            </Stack>
            <Text size="sm" tone="muted">
              {detail.status === 'linked'
                ? `Access granted ${detail.statusDate}${detail.abha ? ` · ABHA ${detail.abha}` : ''}`
                : `Invitation sent ${detail.statusDate}`}
            </Text>
          </Stack>
        ) : null}
      </Dialog>

      <LinkDialog
        open={linking}
        patientName={patientName}
        busy={action.busy}
        error={action.error}
        onClose={() => {
          action.clearError();
          setLinking(false);
        }}
        onSend={(invite) => void send(invite)}
      />
    </>
  );
}
