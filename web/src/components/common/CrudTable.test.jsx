import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/testUtils';
import CrudTable from './CrudTable';

const columns = [{ title: 'Name', dataIndex: 'name' }];
const dataSource = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Beto' },
];

describe('CrudTable', () => {
  it('renders rows, triggers onEdit and delegates the delete action to renderDelete', () => {
    const onEdit = vi.fn();
    const renderDelete = vi.fn((record) => <button type="button">{`delete-${record.id}`}</button>);

    renderWithProviders(
      <CrudTable columns={columns} dataSource={dataSource} loading={false} onEdit={onEdit} renderDelete={renderDelete} />
    );

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText('delete-1')).toBeInTheDocument();
    expect(screen.getByText('delete-2')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Edit/ })[0]);
    expect(onEdit).toHaveBeenCalledWith(dataSource[0]);
    expect(renderDelete).toHaveBeenCalledWith(dataSource[0]);
    expect(renderDelete).toHaveBeenCalledWith(dataSource[1]);
  });

  it('shows the empty state when there is no data', () => {
    renderWithProviders(
      <CrudTable columns={columns} dataSource={[]} loading={false} onEdit={() => {}} renderDelete={() => null} />
    );

    expect(screen.getByText('No records yet')).toBeInTheDocument();
  });

  it('shows an error alert with retry instead of the empty state when loading failed', () => {
    const onRetry = vi.fn();
    const error = { response: { status: 502 } };

    renderWithProviders(
      <CrudTable
        columns={columns}
        dataSource={undefined}
        loading={false}
        error={error}
        onRetry={onRetry}
        onEdit={() => {}}
        renderDelete={() => null}
      />
    );

    expect(screen.getByText('Could not load records')).toBeInTheDocument();
    expect(screen.getByText('The server is unavailable. Please try again in a moment.')).toBeInTheDocument();
    expect(screen.queryByText('No records yet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
