import { Layout, Menu } from 'antd';
import { DashboardOutlined, TeamOutlined, ShoppingOutlined, ContactsOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  {
    key: 'operations',
    type: 'group',
    label: 'Operations',
    children: [
      { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
      { key: '/clients', icon: <ContactsOutlined />, label: 'Clients' },
    ],
  },
  {
    key: 'administration',
    type: 'group',
    label: 'Administration',
    children: [{ key: '/users', icon: <TeamOutlined />, label: 'Users' }],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // collapsedWidth must be the number 0, not the string "0": antd compares it
  // strictly, so a string leaves the sider 200px wide while still rendering the
  // zero-width trigger on top of the content.
  return (
    <Layout.Sider breakpoint="lg" collapsedWidth={0}>
      <div className="vf-logo">
        <span className="vf-logo-mark">VF</span>
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
