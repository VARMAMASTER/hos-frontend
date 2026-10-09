import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Box,
  BrandMark,
  Button,
  Chip,
  Heading,
  NavItem,
  NavSection,
  NOVA_FONTS,
  Sidebar,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  Text,
  TopBar,
  type NovaFontPreset,
} from '@hos/nova-ui';
import { toApiError, type ApiClient } from '@hos/hos-utility';
import { getEntitledModules } from '../modules/registry';
import { getTabWidget } from '../modules/routes';
import type { ModuleCategory } from '../modules/types';

type ApiStatus =
  | { kind: 'checking' }
  | { kind: 'reachable' }
  | { kind: 'degraded' }
  | { kind: 'unreachable'; reason: string };

export interface AppProps {
  api?: Pick<ApiClient, 'get'>;
  tenantName?: string;
  // The modules the tenant has bought and the signed-in user's roles. Both default to none: the app
  // grants nothing it was not given (entitlements fail closed). The demo entry point passes
  // DEMO_ENTITLEMENTS explicitly.
  tenantModules?: readonly string[];
  userRoles?: readonly string[];
  initialModuleId?: string;
  initialTabId?: string;
  // The font preset NovaThemeProvider applies at the root (see root.tsx). The switcher in the top
  // bar is shown when onFontChange is given.
  font?: NovaFontPreset;
  onFontChange?: (font: NovaFontPreset) => void;
}

const NO_ENTITLEMENTS: readonly string[] = [];

const UNEXPECTED_RESPONSE = 'The API answered with an unexpected response.';

function isHealthyBody(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    data.status === 'ok'
  );
}

const CATEGORY_ORDER: ModuleCategory[] = [
  'clinical',
  'financial',
  'intelligence',
  'governance',
  'settings',
  'platform',
];

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  clinical: 'Clinical',
  financial: 'Financial',
  intelligence: 'Intelligence',
  governance: 'Governance',
  settings: 'Settings',
  platform: 'Platform',
};

// The font presets in the order the switcher steps through them, each with the name it shows.
const FONT_ORDER = Object.keys(NOVA_FONTS) as NovaFontPreset[];
const FONT_NAMES: Record<NovaFontPreset, string> = {
  googleSans: 'Google Sans Flex',
  ibmPlexSans: 'IBM Plex Sans',
  ibmPlexMono: 'IBM Plex Mono',
  inter: 'Inter',
};

function nextFont(font: NovaFontPreset): NovaFontPreset {
  const index = FONT_ORDER.indexOf(font);
  return FONT_ORDER[(index + 1) % FONT_ORDER.length] ?? font;
}

export function App({
  api,
  tenantName = 'Hospital OS',
  tenantModules = NO_ENTITLEMENTS,
  userRoles = NO_ENTITLEMENTS,
  initialModuleId,
  initialTabId,
  font = 'googleSans',
  onFontChange,
}: AppProps) {
  const [status, setStatus] = useState<ApiStatus>({ kind: 'checking' });

  useEffect(() => {
    if (!api) return;
    let active = true;
    api.get('/health').then(
      (response) => {
        if (!active) return;
        setStatus(
          isHealthyBody(response.data)
            ? { kind: 'reachable' }
            : { kind: 'unreachable', reason: UNEXPECTED_RESPONSE },
        );
      },
      (error: unknown) => {
        if (!active) return;
        const apiError = toApiError(error);
        setStatus(
          apiError.status === 503
            ? { kind: 'degraded' }
            : { kind: 'unreachable', reason: apiError.message },
        );
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  const entitledModules = useMemo(
    () => getEntitledModules([...tenantModules], [...userRoles]),
    [tenantModules, userRoles],
  );

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId ?? entitledModules[0]?.id ?? '',
  );

  const activeModule = useMemo(
    () =>
      entitledModules.find((m) => m.id === selectedModuleId) ??
      entitledModules[0],
    [entitledModules, selectedModuleId],
  );

  const activeModuleId = activeModule?.id ?? '';

  const defaultTabId = useMemo(() => {
    if (!activeModule) return '';
    return (
      activeModule.tabs.find((t) => t.path === activeModule.defaultPath)?.id ??
      activeModule.tabs[0]?.id ??
      ''
    );
  }, [activeModule]);

  const [selectedTabId, setSelectedTabId] = useState<string>(
    initialTabId ?? defaultTabId,
  );

  const activeTabId = useMemo(() => {
    if (!activeModule) return '';
    const exists = activeModule.tabs.some((t) => t.id === selectedTabId);
    return exists ? selectedTabId : defaultTabId;
  }, [activeModule, selectedTabId, defaultTabId]);

  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const mod = entitledModules.find((m) => m.id === moduleId);
    const defTab =
      mod?.tabs.find((t) => t.path === mod.defaultPath)?.id ??
      mod?.tabs[0]?.id ??
      '';
    setSelectedTabId(defTab);
  };

  const categoriesWithModules = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        modules: entitledModules.filter((m) => m.category === category),
      })).filter((group) => group.modules.length > 0),
    [entitledModules],
  );

  const sidebar = (
    <Sidebar
      navLabel="Main Navigation"
      brand={<BrandMark name="HOS" sub="Platform" />}
      collapsedBrand={<BrandMark name="HOS" />}
    >
      {categoriesWithModules.map(({ category, label, modules }) => (
        <NavSection key={category} label={label}>
          {modules.map((mod) => (
            <NavItem
              key={mod.id}
              as="button"
              active={mod.id === activeModuleId}
              onClick={() => handleSelectModule(mod.id)}
              badge={mod.tabs.find((t) => t.badge)?.badge}
            >
              {mod.title}
            </NavItem>
          ))}
        </NavSection>
      ))}
    </Sidebar>
  );

  const fontName = FONT_NAMES[font];

  return (
    <AppShell sidebar={sidebar}>
      <TopBar
        role="banner"
        actions={
          <>
            {onFontChange ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFontChange(nextFont(font))}
                aria-label={`Font: ${fontName}. Switch to ${FONT_NAMES[nextFont(font)]}.`}
                title="Switch the interface font"
              >
                Font: {fontName}
              </Button>
            ) : null}
            {api ? <StatusChip status={status} /> : null}
          </>
        }
      />
      {activeModule ? (
        <Box padding="s8">
          <Stack gap="s6">
            {/* The page header, as the prototype puts it on the canvas below the top bar: the
                module's name, with the hospital above it. */}
            <Stack gap="s1">
              <Text variant="label" tone="muted">
                {tenantName}
              </Text>
              <Heading level="h1">{activeModule.title}</Heading>
            </Stack>
            <Tabs value={activeTabId} onValueChange={setSelectedTabId}>
              <Stack gap="s6">
                <TabList aria-label={`${activeModule.title} tabs`}>
                  {activeModule.tabs.map((tab) => (
                    <Tab key={tab.id} value={tab.id}>
                      {tab.label}
                      {tab.badge ? (
                        <Tag variant="outline" tone="brand">
                          {tab.badge}
                        </Tag>
                      ) : null}
                    </Tab>
                  ))}
                </TabList>
                {activeModule.tabs.map((tab) => (
                  <TabPanel key={tab.id} value={tab.id}>
                    {getTabWidget(activeModule.id, tab.id)}
                  </TabPanel>
                ))}
              </Stack>
            </Tabs>
          </Stack>
        </Box>
      ) : (
        <Box padding="s8">
          <Stack gap="s1">
            <Text variant="label" tone="muted">
              {tenantName}
            </Text>
            <Text tone="muted">
              No modules are available for this hospital and your role.
            </Text>
          </Stack>
        </Box>
      )}
    </AppShell>
  );
}

function StatusChip({ status }: { status: ApiStatus }) {
  switch (status.kind) {
    case 'checking':
      return <Chip>Checking API…</Chip>;
    case 'reachable':
      return <Chip tone="good">API reachable</Chip>;
    case 'degraded':
      return <Chip tone="warn">API degraded</Chip>;
    case 'unreachable':
      return <Chip tone="crit">API unreachable</Chip>;
  }
}

export default App;
