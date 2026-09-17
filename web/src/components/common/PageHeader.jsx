import { Button, Flex } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// The page title lives in the Topbar now (see AppLayout/Topbar), so this
// component only renders the page's primary action, right-aligned.
export default function PageHeader({ actionLabel, onAction }) {
  if (!actionLabel) return null;

  return (
    <Flex justify="flex-end" style={{ marginBottom: 16 }}>
      <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
        {actionLabel}
      </Button>
    </Flex>
  );
}
