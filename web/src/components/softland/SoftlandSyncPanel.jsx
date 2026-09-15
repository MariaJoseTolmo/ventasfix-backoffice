import { Alert, Button, Card, Descriptions, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useSoftlandSync } from '../../hooks/useSoftlandSync';
import { getErrorMessage, isStatus } from '../../utils/apiError';

// Consumes the softland-mock external service through POST /api/softland/sync
// (see docs/adr/ADR-006-mock-softland-con-adapter.md). Reused on the
// Products and Dashboard pages.
export default function SoftlandSyncPanel() {
  const { mutate, isPending, data, error, reset } = useSoftlandSync();

  const is502 = isStatus(error, 502);

  return (
    <Card title="Softland integration" size="small">
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          icon={<SyncOutlined />}
          loading={isPending}
          onClick={() => {
            reset();
            mutate();
          }}
        >
          Sync with Softland
        </Button>
        {data && (
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Sent">{data.sent}</Descriptions.Item>
            <Descriptions.Item label="Received">{data.received}</Descriptions.Item>
            <Descriptions.Item label="Status">{data.status}</Descriptions.Item>
          </Descriptions>
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            message={is502 ? 'Softland is unavailable' : 'Sync failed'}
            description={getErrorMessage(error)}
          />
        )}
      </Space>
    </Card>
  );
}
