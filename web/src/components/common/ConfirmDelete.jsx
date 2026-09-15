import { Button, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../utils/apiError';

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ConfirmDelete({ onConfirm, entityLabel = 'record' }) {
  async function handleConfirm() {
    try {
      await onConfirm();
      message.success(`${capitalize(entityLabel)} deleted successfully`);
    } catch (error) {
      message.error(getErrorMessage(error, `Could not delete ${entityLabel}`));
    }
  }

  return (
    <Popconfirm
      title={`Delete this ${entityLabel}?`}
      description="This action cannot be undone from the UI."
      okText="Delete"
      okType="danger"
      cancelText="Cancel"
      onConfirm={handleConfirm}
    >
      <Button type="link" danger icon={<DeleteOutlined />}>
        Delete
      </Button>
    </Popconfirm>
  );
}
