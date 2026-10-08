import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import App from './app';

afterEach(() => cleanup());

describe('App Component with Modular Shell', () => {
  it('renders AppShell with navigation items from the module registry', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy();
    expect(screen.getByText('Reception / OPD')).toBeTruthy();
    expect(screen.getByText('Doctor Workspace')).toBeTruthy();
  });

  it('renders TopBar with active workspace title and tenant name', () => {
    render(<App tenantName="City General Hospital" />);
    expect(screen.getByText('City General Hospital')).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
  });

  it('renders sub-tab header for the active module and mounts active tab widget', () => {
    render(<App />);
    // Reception is the default first clinical module
    expect(screen.getByRole('tab', { name: /live queue/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /appointments/i })).toBeTruthy();
    // Default tab widget is Live Queue
    expect(screen.getByText('Curated workflow for Live Queue.')).toBeTruthy();
  });

  it('switches active module and updates tabs and active tab widget on navigation click', () => {
    render(<App />);

    // Click on Doctor Workspace navigation item
    const doctorNav = screen.getByRole('button', { name: /doctor workspace/i });
    fireEvent.click(doctorNav);

    // Doctor tabs should now be present
    expect(screen.getByRole('tab', { name: /my queue/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /consultation/i })).toBeTruthy();
    expect(screen.getByText('Curated workflow for My Queue.')).toBeTruthy();
  });

  it('switches active tab within the active module when tab clicked', () => {
    render(<App />);

    const appointmentsTab = screen.getByRole('tab', { name: /appointments/i });
    fireEvent.click(appointmentsTab);

    expect(screen.getByText('Curated workflow for Appointments.')).toBeTruthy();
  });

  it('filters navigation items based on user entitlements when specified', () => {
    render(
      <App
        tenantModules={['doctor']}
        userRoles={['ROLE_DOCTOR']}
      />,
    );

    expect(screen.getByText('Doctor Workspace')).toBeTruthy();
    expect(screen.queryByText('Reception / OPD')).toBeNull();
  });
});
