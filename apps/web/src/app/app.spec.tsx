import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NOVA_FONTS } from '@hos/nova-ui';
import { MODULE_REGISTRY } from '../modules/registry';
import App from './app';
import { DEMO_ENTITLEMENTS } from './demo-entitlements';
import { Root } from './root';

afterEach(() => cleanup());

const nav = () => screen.getByRole('navigation', { name: /main navigation/i });

describe('App shell', () => {
  it('lists the entitled modules in the sidebar, from the module registry', () => {
    render(<App {...DEMO_ENTITLEMENTS} />);
    expect(
      within(nav()).getByRole('button', { name: /^Reception \/ OPD/ }),
    ).toBeTruthy();
    expect(within(nav()).getByRole('button', { name: /^Doctor/ })).toBeTruthy();
  });

  it('shows the tenant and the active module, as a module, never a "workspace"', () => {
    render(<App {...DEMO_ENTITLEMENTS} tenantName="City General Hospital" />);
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByText('City General Hospital')).toBeTruthy();
    fireEvent.click(within(nav()).getByRole('button', { name: /^Doctor/ }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Doctor' }),
    ).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/workspace/i);
  });

  it('renders the active module tabs and mounts the active tab in its panel', () => {
    render(<App {...DEMO_ENTITLEMENTS} />);
    expect(screen.getByRole('tab', { name: /live queue/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /appointments/i })).toBeTruthy();
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: /live queue/i }).id,
    );
  });

  it('switches module, and with it the tabs and the mounted tab', () => {
    render(<App {...DEMO_ENTITLEMENTS} />);
    fireEvent.click(within(nav()).getByRole('button', { name: /^Doctor/ }));
    expect(screen.getByRole('tab', { name: /my queue/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /consultation/i })).toBeTruthy();
    expect(
      within(screen.getByRole('tabpanel')).getByRole('heading', {
        name: 'My Queue',
      }),
    ).toBeTruthy();
  });

  it('switches tab within the active module', () => {
    render(<App {...DEMO_ENTITLEMENTS} />);
    const appointments = screen.getByRole('tab', { name: /appointments/i });
    fireEvent.click(appointments);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      appointments.id,
    );
  });

  it('a tab badge is a word next to the label, inside the tab name', () => {
    render(<App {...DEMO_ENTITLEMENTS} />);
    expect(screen.getByRole('tab', { name: /live queue\s*14/i })).toBeTruthy();
  });

  it('filters the sidebar by the tenant entitlements and the user roles', () => {
    render(<App tenantModules={['doctor']} userRoles={['ROLE_DOCTOR']} />);
    expect(within(nav()).getByRole('button', { name: /^Doctor/ })).toBeTruthy();
    expect(
      within(nav()).queryByRole('button', { name: /^Reception \/ OPD/ }),
    ).toBeNull();
  });
});

// With nothing granted, nothing is shown: a missing entitlement or role never opens every module.
describe('entitlements fail closed', () => {
  it('shows no module when no tenant entitlements or roles are given', () => {
    render(<App />);
    expect(within(nav()).queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByText(/no modules are available/i)).toBeTruthy();
  });

  it('shows no module for an empty entitlement set, whatever the role', () => {
    render(<App tenantModules={[]} userRoles={['ROLE_SUPERADMIN']} />);
    expect(within(nav()).queryAllByRole('button')).toHaveLength(0);
  });

  it('grants nothing to an unknown role, even with every module entitled', () => {
    render(
      <App
        tenantModules={MODULE_REGISTRY.map((m) => m.id)}
        userRoles={['ROLE_UNKNOWN']}
      />,
    );
    expect(within(nav()).queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('the demo entitlements are explicit, not a default', () => {
    expect(DEMO_ENTITLEMENTS.tenantModules).toEqual(
      MODULE_REGISTRY.map((m) => m.id),
    );
    expect(DEMO_ENTITLEMENTS.userRoles.length).toBeGreaterThan(0);
  });
});

// The theme, the scheme, the material and the font come from one NovaThemeProvider at the root.
describe('Root: one NovaThemeProvider for the whole app', () => {
  const provider = () =>
    nav().closest('[data-nova-theme]') as HTMLElement | null;

  it('wraps the sidebar and the content in the provider', () => {
    render(<Root {...DEMO_ENTITLEMENTS} />);
    expect(provider()).not.toBeNull();
    expect(screen.getByRole('banner').closest('[data-nova-theme]')).toBe(
      provider(),
    );
  });

  it('the font switcher sets the provider font, so the sidebar and display type follow', () => {
    render(<Root {...DEMO_ENTITLEMENTS} />);
    expect(provider()?.dataset['novaFont']).toBe('googleSans');
    const switcher = screen.getByRole('button', { name: /font/i });
    fireEvent.click(switcher);
    expect(provider()?.dataset['novaFont']).toBe('ibmPlexSans');
    expect(provider()?.style.getPropertyValue('--nova-font-body')).toBe(
      NOVA_FONTS.ibmPlexSans,
    );
    expect(provider()?.style.getPropertyValue('--nova-font-display')).toBe(
      NOVA_FONTS.ibmPlexSans,
    );
    // No inner element carries its own font variable.
    expect(
      [...document.querySelectorAll<HTMLElement>('[style]')].filter(
        (element) =>
          element !== provider() &&
          element.style.getPropertyValue('--nova-font-body') !== '',
      ),
    ).toEqual([]);
    expect(switcher.getAttribute('aria-label')).toMatch(/IBM Plex Sans/);
  });

  it('cycles through every font preset and back', () => {
    render(<Root {...DEMO_ENTITLEMENTS} />);
    const seen: string[] = [];
    for (let i = 0; i < Object.keys(NOVA_FONTS).length; i++) {
      seen.push(provider()?.dataset['novaFont'] ?? '');
      fireEvent.click(screen.getByRole('button', { name: /font/i }));
    }
    expect([...seen].sort()).toEqual(Object.keys(NOVA_FONTS).sort());
    expect(provider()?.dataset['novaFont']).toBe('googleSans');
  });
});
