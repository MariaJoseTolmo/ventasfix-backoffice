import { Layout, Flex, Typography, Button, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    // Server state belongs to the session that fetched it: drop the cache so
    // the next sign-in (possibly another user) starts from the network.
    queryClient.clear();
    navigate('/login');
  }

  return (
    <Layout.Header style={{ background: '#fff', padding: '0 24px' }}>
      <Flex justify="flex-end" align="center" style={{ height: '100%' }} gap={12}>
        <Avatar icon={<UserOutlined />} />
        <Typography.Text>{user?.email}</Typography.Text>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Flex>
    </Layout.Header>
  );
}
