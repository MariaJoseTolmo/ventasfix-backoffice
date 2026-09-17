import { Layout, Flex, Typography, Button, Avatar } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Title + subtitle per route: the single place page titles are shown (see
// PageHeader, which only renders the primary action now).
const PAGE_INFO = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your business' },
  '/products': { title: 'Products', subtitle: 'Manage your catalog and stock' },
  '/clients': { title: 'Clients', subtitle: 'Manage your companies' },
  '/users': { title: 'Users', subtitle: 'Manage backoffice access' },
};

function initials(user) {
  if (!user) return '';
  const { first_name: firstName, last_name: lastName, email } = user;
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }
  return email ? email[0].toUpperCase() : '';
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const page = PAGE_INFO[location.pathname] ?? {};

  function handleLogout() {
    logout();
    // Server state belongs to the session that fetched it: drop the cache so
    // the next sign-in (possibly another user) starts from the network.
    queryClient.clear();
    navigate('/login');
  }

  return (
    <Layout.Header style={{ height: 'auto', lineHeight: 'normal', padding: '12px 24px', borderBottom: '1px solid #e3e7e5' }}>
      <Flex justify="space-between" align="center">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {page.title}
          </Typography.Title>
          {page.subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {page.subtitle}
            </Typography.Text>
          )}
        </div>
        <Flex align="center" gap={12}>
          <Avatar>{initials(user)}</Avatar>
          <Typography.Text>{user?.email}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </Flex>
    </Layout.Header>
  );
}
