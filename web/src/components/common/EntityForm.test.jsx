import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/testUtils';
import EntityForm from './EntityForm';

const fields = [
  { name: 'email', label: 'Email', rules: [{ required: true, message: 'Email is required' }] },
  { name: 'first_name', label: 'First name' },
];

describe('EntityForm', () => {
  it('maps a 422 apiError detail to the matching field error', async () => {
    const apiError = {
      type: 'ValidationError',
      message: 'Invalid data',
      details: [{ field: 'email', message: 'email must belong to the @ventasfix.cl domain' }],
    };

    renderWithProviders(
      <EntityForm fields={fields} initialValues={{}} onSubmit={() => {}} submitting={false} apiError={apiError} />
    );

    expect(await screen.findByText('email must belong to the @ventasfix.cl domain')).toBeInTheDocument();
    // Everything mapped to a field: no summary alert.
    expect(screen.queryByText('Invalid data')).not.toBeInTheDocument();
  });

  it('shows details that do not match any field in a summary alert instead of dropping them', async () => {
    const apiError = {
      type: 'ValidationError',
      message: 'The submitted data is not valid',
      details: [{ field: 'body', message: 'At least one field must be provided' }],
    };

    renderWithProviders(
      <EntityForm fields={fields} initialValues={{}} onSubmit={() => {}} submitting={false} apiError={apiError} />
    );

    expect(await screen.findByText('The submitted data is not valid')).toBeInTheDocument();
    expect(screen.getByText('At least one field must be provided')).toBeInTheDocument();
  });

  it('runs client-side required rules before calling onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <EntityForm fields={fields} initialValues={null} onSubmit={onSubmit} submitting={false} apiError={null} />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Email'), 'ana@ventasfix.cl');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'ana@ventasfix.cl' });
  });
});
