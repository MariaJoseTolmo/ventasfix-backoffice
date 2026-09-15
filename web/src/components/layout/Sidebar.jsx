import { Layout, Menu } from 'antd';
import { DashboardOutlined, TeamOutlined, ShoppingOutlined, ContactsOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <TeamOutlined />, label: 'Users' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
  { key: '/clients', icon: <ContactsOutlined />, label: 'Clients' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Layout.Sider breakpoint="lg" collapsedWidth="0">
      <div style={{ color: 'white', textAlign: 'center', padding: 16, fontWeight: 'bold', fontSize: 18 }}>
        VentasFix
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Layout.Sider>
  );
}
