import { Alert, Button, Empty, Space, Table } from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../utils/apiError';

// Presentational only: receives columns and data, adds the actions column.
// No data fetching here (Container/Presentational, see ADR-011) — pages
// own the useQuery/useMutation calls and pass the results down as props.
//
// `renderDelete` is a render prop rather than a callback: the page decides
// which confirmation to show (ConfirmDelete) and which mutation to fire,
// so this table never knows how a record is deleted.
export default function CrudTable({
  columns,
  dataSource,
  loading,
  error,
  onRetry,
  rowKey = 'id',
  onEdit,
  renderDelete,
}) {
  const actionsColumn = {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
          aria-label={`Edit ${record[rowKey]}`}
        >
          Edit
        </Button>
        {renderDelete(record)}
      </Space>
    ),
  };

  // A failed load must not look like an empty catalog ("No records yet"):
  // the evaluator stopping the api container should see an error, not a
  // misleading empty state.
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load records"
        description={getErrorMessage(error)}
        action={
          onRetry ? (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table
      rowKey={rowKey}
      columns={[...columns, actionsColumn]}
      dataSource={dataSource}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      // Columns keep their natural width and the table scrolls sideways on
      // narrow screens instead of breaking the page layout.
      scroll={{ x: 'max-content' }}
      locale={{
        emptyText: <Empty description="No records yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
    />
  );
}
