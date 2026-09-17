import { useState } from 'react';
import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useSoftlandSync } from '../../hooks/useSoftlandSync';
import { getErrorMessage, isStatus } from '../../utils/apiError';

// Consumes the softland-mock external service through POST /api/softland/sync
// (see docs/adr/ADR-006-mock-softland-con-adapter.md). Reused on the
// Products and Dashboard pages.
export default function SoftlandSyncPanel() {
  const { mutate, isPending, error, reset } = useSoftlandSync();
  // Last sync result for this session only: populated from the mutation's
  // own onSuccess, never persisted, so it resets whenever the panel remounts.
  const [lastSync, setLastSync] = useState(null);

  const is502 = isStatus(error, 502);

  function handleSync() {
    reset();
    mutate(undefined, { onSuccess: (data) => setLastSync(data) });
  }

  return (
    <Card title="Softland integration" size="small">
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Button type="primary" icon={<SyncOutlined />} loading={isPending} onClick={handleSync}>
          Sync with Softland
        </Button>
        {lastSync ? (
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Sent">{lastSync.sent}</Descriptions.Item>
            <Descriptions.Item label="Received">{lastSync.received}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={lastSync.status === 'ok' ? 'green' : 'default'}>{lastSync.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">Not synced yet in this session</Typography.Text>
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
