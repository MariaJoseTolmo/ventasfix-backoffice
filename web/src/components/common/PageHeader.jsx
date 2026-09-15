import { Button, Flex, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function PageHeader({ title, actionLabel, onAction }) {
  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {actionLabel && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Flex>
  );
}
