import type { Meta, StoryObj } from '@storybook/react-vite';
import { NovaThemeProvider } from '../theme/theme-provider';
import { NOVA_MATERIALS, type NovaMaterial } from '../tokens/material';
import { AdmissionForm } from './admission-form';

interface FormsArgs {
  material: NovaMaterial;
}

const meta: Meta<FormsArgs> = {
  title: 'Forms/Admission form',
  argTypes: {
    material: {
      description:
        'Glass or solid. The dialog is portalled to <body>, so it keeps the product default.',
      control: 'inline-radio',
      options: NOVA_MATERIALS,
    },
  },
  args: { material: 'glass' },
};

export default meta;

// Every control from the forms batch in one realistic screen. It opens on the error states: fix the
// mobile number and the ward, tick consent, then admit to see the confirmation dialog.
export const Admission: StoryObj<FormsArgs> = {
  render: ({ material }) => (
    <NovaThemeProvider
      material={material}
      className="nova-canvas -m-6 min-h-screen p-6"
    >
      <AdmissionForm />
    </NovaThemeProvider>
  ),
};
