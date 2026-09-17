import { useMemo, useState } from 'react';
import { Image, Modal, Space, Typography, message } from 'antd';
import PageHeader from '../components/common/PageHeader';
import CrudTable from '../components/common/CrudTable';
import EntityForm from '../components/common/EntityForm';
import ConfirmDelete from '../components/common/ConfirmDelete';
import StockGauge, { stockStatusRank } from '../components/common/StockGauge';
import SoftlandSyncPanel from '../components/softland/SoftlandSyncPanel';
import { useProducts } from '../hooks/useProducts';
import { getApiError, getErrorMessage, isStatus } from '../utils/apiError';
import { formatCurrency, formatVatDelta, toImageSrc } from '../utils/format';

function toThresholds(record) {
  return {
    current: record.current_stock,
    minimum: record.minimum_stock,
    low: record.low_stock,
    high: record.high_stock,
  };
}

const columns = [
  {
    title: 'Image',
    dataIndex: 'image_url',
    render: (imageUrl) => (
      <Image
        src={toImageSrc(imageUrl)}
        width={48}
        height={48}
        style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e3e7e5' }}
      />
    ),
  },
  {
    title: 'SKU',
    dataIndex: 'sku',
    sorter: (a, b) => a.sku.localeCompare(b.sku),
    render: (value) => <span className="vf-mono">{value}</span>,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (value, record) => (
      <div>
        <div>{value}</div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {record.short_description}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: 'Net price',
    dataIndex: 'net_price',
    align: 'right',
    sorter: (a, b) => Number(a.net_price) - Number(b.net_price),
    render: (value) => <span className="vf-mono">{formatCurrency(value)}</span>,
  },
  {
    title: 'Sale price',
    dataIndex: 'sale_price',
    align: 'right',
    sorter: (a, b) => Number(a.sale_price) - Number(b.sale_price),
    render: (value, record) => (
      <div>
        <div className="vf-mono">{formatCurrency(value)}</div>
        <Typography.Text type="secondary" className="vf-mono" style={{ fontSize: 12 }}>
          {formatVatDelta(record.net_price, value)}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: 'Stock',
    dataIndex: 'current_stock',
    // Sorts by "needs attention" rank (critical < low < ok < overstock),
    // not by the raw stock number.
    sorter: (a, b) => stockStatusRank(toThresholds(a)) - stockStatusRank(toThresholds(b)),
    render: (_, record) => {
      const thresholds = toThresholds(record);
      return <StockGauge {...thresholds} />;
    },
  },
];

// `editing` is the record being edited (null on create). On edit the image is
// optional — the API keeps the current one unless a new file is sent — and
// the current image is shown under the picker so the user knows what stays.
function buildFields(editing) {
  const isEdit = Boolean(editing);
  return [
    { name: 'sku', label: 'SKU', rules: [{ required: true, message: 'SKU is required' }] },
    { name: 'name', label: 'Name', rules: [{ required: true, message: 'Name is required' }] },
    {
      name: 'short_description',
      label: 'Short description',
      rules: [{ required: true, message: 'Short description is required' }],
    },
    {
      name: 'long_description',
      label: 'Long description',
      type: 'textarea',
      rules: [{ required: true, message: 'Long description is required' }],
    },
    {
      name: 'image',
      label: 'Product image',
      type: 'upload',
      rules: isEdit ? [] : [{ required: true, message: 'Product image is required' }],
      extra: isEdit ? (
        <Space align="center">
          <Image src={toImageSrc(editing.image_url)} width={40} height={40} style={{ objectFit: 'cover' }} />
          <span>Current image is kept unless you select a new one.</span>
        </Space>
      ) : undefined,
    },
    {
      name: 'net_price',
      label: 'Net price',
      type: 'number',
      min: 0,
      rules: [{ required: true, message: 'Net price is required' }],
    },
    {
      name: 'current_stock',
      label: 'Current stock',
      type: 'number',
      min: 0,
      rules: [{ required: true, message: 'Current stock is required' }],
    },
    {
      name: 'minimum_stock',
      label: 'Minimum stock',
      type: 'number',
      min: 0,
      rules: [{ required: true, message: 'Minimum stock is required' }],
    },
    {
      name: 'low_stock',
      label: 'Low stock',
      type: 'number',
      min: 0,
      rules: [{ required: true, message: 'Low stock is required' }],
    },
    {
      name: 'high_stock',
      label: 'High stock',
      type: 'number',
      min: 0,
      rules: [{ required: true, message: 'High stock is required' }],
    },
  ];
}

export default function ProductsPage() {
  const { list, create, update, remove } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [apiError, setApiError] = useState(null);

  const activeMutation = editing ? update : create;
  // Stable reference: EntityForm keys its 422 → field mapping on `fields`.
  const fields = useMemo(() => buildFields(editing), [editing]);

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
      message.success(`Product ${editing ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
    } catch (error) {
      if (isStatus(error, 422)) {
        setApiError(getApiError(error));
      } else {
        message.error(getErrorMessage(error, 'Could not save product'));
      }
    }
  }

  return (
    <>
      <PageHeader actionLabel="New product" onAction={openCreate} />
      <div style={{ marginBottom: 16 }}>
        <SoftlandSyncPanel />
      </div>
      <CrudTable
        columns={columns}
        dataSource={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        onEdit={openEdit}
        renderDelete={(record) => (
          <ConfirmDelete onConfirm={() => remove.mutateAsync(record.id)} entityLabel="product" />
        )}
      />
      <Modal
        title={editing ? 'Edit product' : 'New product'}
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
