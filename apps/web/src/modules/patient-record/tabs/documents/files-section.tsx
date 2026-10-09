import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  EmptyState,
  Grid,
  Heading,
  Stack,
  Tag,
  Text,
  Dialog,
} from '@hos/nova-ui';
import type { PatientDocument } from '../../data';
import { Section } from '../../ui';

export interface FilesSectionProps {
  files: PatientDocument[];
}

const LOCK = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
  </svg>
);

// The files on record (the prototype's "Uploaded files"): each with its type, who put it there and
// when, and a preview. Insurance and ID scans are staff-only, said in words.
export function FilesSection({ files }: FilesSectionProps) {
  const [viewing, setViewing] = useState<PatientDocument | null>(null);
  return (
    <>
      <Section
        title="Uploaded files"
        description={`${files.length} files on record`}
        footnote="Lab reports and discharge summaries here are the same files she can download from her own app. Insurance and ID scans are staff-only."
      >
        {files.length === 0 ? (
          <EmptyState
            title="No documents on file"
            description="Uploaded reports and scans appear here."
          />
        ) : (
          <Grid columns={2} gap="s4" role="list">
            {files.map((file) => (
              <Box
                key={file.id}
                role="listitem"
                surface="inset"
                radius="card"
                padding="s4"
                className="min-w-0"
              >
                <Stack gap="s3">
                  <Stack direction="horizontal" align="center" gap="s3">
                    <Tag tone="neutral">{file.format}</Tag>
                    <Text
                      as="span"
                      weight="semibold"
                      font="mono"
                      className="min-w-0 break-all text-label"
                    >
                      {file.name}
                    </Text>
                  </Stack>
                  <Text size="sm" tone="muted" className="tabular-nums">
                    {`${file.sizeLabel} · uploaded ${file.uploadedOn} · ${file.uploadedBy}`}
                  </Text>
                  <Stack
                    direction="horizontal"
                    align="center"
                    justify="between"
                    wrap
                    gap="s2"
                  >
                    <Stack direction="horizontal" align="center" wrap gap="s2">
                      <Chip tone="neutral">{file.category}</Chip>
                      {file.staffOnly ? (
                        <Chip tone="info" icon={LOCK}>
                          Staff only
                        </Chip>
                      ) : null}
                    </Stack>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`View ${file.name}`}
                      onClick={() => setViewing(file)}
                    >
                      View
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Grid>
        )}
      </Section>
      <Dialog
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ''}
        description={
          viewing ? `${viewing.category} · ${viewing.format}` : undefined
        }
      >
        {viewing ? (
          <Stack gap="s2" align="center" className="py-s6 text-center">
            <Heading level="h4" tone="muted">
              {viewing.preview.heading}
            </Heading>
            {viewing.preview.lines.map((line) => (
              <Text key={line} size="sm" tone="muted">
                {line}
              </Text>
            ))}
            <Text size="sm" tone="faint">
              A preview of the stored file; the file itself is not shown in this
              prototype.
            </Text>
          </Stack>
        ) : null}
      </Dialog>
    </>
  );
}
