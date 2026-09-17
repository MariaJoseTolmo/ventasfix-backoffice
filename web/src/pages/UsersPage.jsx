import { useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import PageHeader from '../components/common/PageHeader';
import CrudTable from '../components/common/CrudTable';
import EntityForm from '../components/common/EntityForm';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { useUsers } from '../hooks/useUsers';
import { getApiError, getErrorMessage, isStatus } from '../utils/apiError';

const columns = [
  {
    title: 'RUT',
    dataIndex: 'rut',
    sorter: (a, b) => a.rut.localeCompare(b.rut),
    render: (value) => <span className="vf-mono">{value}</span>,
  },
  { title: 'First name', dataIndex: 'first_name', sorter: (a, b) => a.first_name.localeCompare(b.first_name) },
  { title: 'Last name', dataIndex: 'last_name', sorter: (a, b) => a.last_name.localeCompare(b.last_name) },
  { title: 'Email', dataIndex: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
];

function buildFields(isEdit) {
  return [
    { name: 'rut', label: 'RUT', rules: [{ required: true, message: 'RUT is required' }] },
    { name: 'first_name', label: 'First name', rules: [{ required: true, message: 'First name is required' }] },
    { name: 'last_name', label: 'Last name', rules: [{ required: true, message: 'Last name is required' }] },
    { name: 'email', label: 'Email', rules: [{ required: true, message: 'Email is required' }] },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      rules: isEdit ? [] : [{ required: true, message: 'Password is required' }],
    },
  ];
}

export default function UsersPage() {
  const { list, create, update, remove } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [apiError, setApiError] = useState(null);

  const activeMutation = editing ? update : create;
  // Stable reference: EntityForm keys its 422 → field mapping on `fields`.
  const fields = useMemo(() => buildFields(Boolean(editing)), [editing]);

  function openCreate() {
    setEditing(null);
    setApiError(null);
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    setApiError(null);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setApiError(null);
    const payload = { ...values };
    if (editing && !payload.password) delete payload.password;

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      message.success(`User ${editing ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
    } catch (error) {
      if (isStatus(error, 422)) {
        setApiError(getApiError(error));
      } else {
        message.error(getErrorMessage(error, 'Could not save user'));
      }
    }
  }

  return (
    <>
      <PageHeader actionLabel="New user" onAction={openCreate} />
      <CrudTable
        columns={columns}
        dataSource={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        onEdit={openEdit}
        renderDelete={(record) => (
          <ConfirmDelete onConfirm={() => remove.mutateAsync(record.id)} entityLabel="user" />
        )}
      />
      <Modal
        title={editing ? 'Edit user' : 'New user'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <EntityForm
          fields={fields}
          initialValues={editing}
          onSubmit={handleSubmit}
          submitting={activeMutation.isPending}
          apiError={apiError}
        />
      </Modal>
    </>
  );
}
