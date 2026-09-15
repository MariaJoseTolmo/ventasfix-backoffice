import { useState } from 'react';
import { Modal, message } from 'antd';
import PageHeader from '../components/common/PageHeader';
import CrudTable from '../components/common/CrudTable';
import EntityForm from '../components/common/EntityForm';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { useClients } from '../hooks/useClients';
import { getApiError, getErrorMessage, isStatus } from '../utils/apiError';

const columns = [
  { title: 'Company RUT', dataIndex: 'company_rut', sorter: (a, b) => a.company_rut.localeCompare(b.company_rut) },
  { title: 'Legal name', dataIndex: 'legal_name', sorter: (a, b) => a.legal_name.localeCompare(b.legal_name) },
  { title: 'Industry', dataIndex: 'industry', sorter: (a, b) => a.industry.localeCompare(b.industry) },
  { title: 'Contact', dataIndex: 'contact_name' },
  { title: 'Contact email', dataIndex: 'contact_email' },
  { title: 'Phone', dataIndex: 'phone' },
];

const fields = [
  { name: 'company_rut', label: 'Company RUT', rules: [{ required: true, message: 'Company RUT is required' }] },
  { name: 'legal_name', label: 'Legal name', rules: [{ required: true, message: 'Legal name is required' }] },
  { name: 'industry', label: 'Industry', rules: [{ required: true, message: 'Industry is required' }] },
  { name: 'address', label: 'Address', rules: [{ required: true, message: 'Address is required' }] },
  { name: 'phone', label: 'Phone', rules: [{ required: true, message: 'Phone is required' }] },
  { name: 'contact_name', label: 'Contact name', rules: [{ required: true, message: 'Contact name is required' }] },
  {
    name: 'contact_email',
    label: 'Contact email',
    rules: [{ required: true, message: 'Contact email is required' }],
  },
];

export default function ClientsPage() {
  const { list, create, update, remove } = useClients();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [apiError, setApiError] = useState(null);

  const activeMutation = editing ? update : create;

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
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload: values });
      } else {
        await create.mutateAsync(values);
      }
      message.success(`Client ${editing ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
    } catch (error) {
      if (isStatus(error, 422)) {
        setApiError(getApiError(error));
      } else {
        message.error(getErrorMessage(error, 'Could not save client'));
      }
    }
  }

  return (
    <>
      <PageHeader title="Clients" actionLabel="New client" onAction={openCreate} />
      <CrudTable
        columns={columns}
        dataSource={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        onEdit={openEdit}
        renderDelete={(record) => (
          <ConfirmDelete onConfirm={() => remove.mutateAsync(record.id)} entityLabel="client" />
        )}
      />
      <Modal
        title={editing ? 'Edit client' : 'New client'}
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
