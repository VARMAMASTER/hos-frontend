import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  BrandMark,
  Chip,
  NavItem,
  NavSection,
  Sidebar,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TopBar,
} from '@hos/nova-ui';
import { toApiError, type ApiClient } from '@hos/hos-utility';
import { MODULE_REGISTRY, getEntitledModules } from '../modules/registry';
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
  tenantModules?: string[];
  userRoles?: string[];
  initialModuleId?: string;
  initialTabId?: string;
}

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

export function App({
  api,
  tenantName = 'Hospital OS',
  tenantModules,
  userRoles,
  initialModuleId,
  initialTabId,
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

  const effectiveTenantModules = useMemo(
    () => tenantModules ?? MODULE_REGISTRY.map((m) => m.id),
    [tenantModules],
  );
  const effectiveUserRoles = useMemo(
    () => userRoles ?? ['ROLE_SUPERADMIN'],
    [userRoles],
  );

  const entitledModules = useMemo(
    () => getEntitledModules(effectiveTenantModules, effectiveUserRoles),
    [effectiveTenantModules, effectiveUserRoles],
  );

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId ?? (entitledModules[0]?.id ?? 'reception'),
  );

  const activeModule = useMemo(() => {
    return (
      entitledModules.find((m) => m.id === selectedModuleId) ??
      entitledModules[0]
    );
  }, [entitledModules, selectedModuleId]);

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

  const handleSelectTab = (tabId: string) => {
    setSelectedTabId(tabId);
  };

  const categoriesWithModules = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      modules: entitledModules.filter((m) => m.category === category),
    })).filter((group) => group.modules.length > 0);
  }, [entitledModules]);

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

  return (
    <AppShell sidebar={sidebar}>
      <div className="flex min-h-screen flex-col">
        <TopBar
          role="banner"
          actions={api ? <StatusChip status={status} /> : undefined}
        >
          <div className="flex items-center gap-s3">
            <span className="font-display text-subtitle font-bold text-on-primary">
              {tenantName}
            </span>
            <span className="text-meta text-[color:var(--nova-chrome-ink-2)]">/</span>
            <span className="text-body font-medium text-on-primary">
              {activeModule ? `${activeModule.title} Workspace` : 'Workspace'}
            </span>
          </div>
        </TopBar>

        {activeModule ? (
          <Tabs
            value={activeTabId}
            onValueChange={handleSelectTab}
            className="flex flex-1 flex-col"
          >
            <div className="border-b border-border bg-surface px-s8 py-s3">
              <TabList aria-label={`${activeModule.title} Tabs`}>
                {activeModule.tabs.map((tab) => (
                  <Tab key={tab.id} value={tab.id}>
                    <span>{tab.label}</span>
                    {tab.badge ? (
                      <span className="ml-s2 inline-flex items-center justify-center rounded-full bg-chrome-accent px-s1.5 py-0.5 text-badge font-semibold text-chrome-ring">
                        {tab.badge}
                      </span>
                    ) : null}
                  </Tab>
                ))}
              </TabList>
            </div>
            <div className="flex-1 p-s8">
              {activeModule.tabs.map((tab) => (
                <TabPanel key={tab.id} value={tab.id}>
                  {getTabWidget(activeModule.id, tab.id)}
                </TabPanel>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="p-s8 text-body text-ink-2">
            No entitled modules available for current role.
          </div>
        )}
      </div>
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
