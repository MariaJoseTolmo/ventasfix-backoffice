import { Alert, Button, Col, Row } from 'antd';
import { TeamOutlined, ShoppingOutlined, ContactsOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import SoftlandSyncPanel from '../components/softland/SoftlandSyncPanel';
import { useDashboard } from '../hooks/useDashboard';
import { getErrorMessage } from '../utils/apiError';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <>
      <PageHeader title="Dashboard" />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Could not load the summary"
          description={getErrorMessage(error)}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Users" value={data?.users} loading={isLoading} prefix={<TeamOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Products" value={data?.products} loading={isLoading} prefix={<ShoppingOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Clients" value={data?.clients} loading={isLoading} prefix={<ContactsOutlined />} />
        </Col>
      </Row>
      <SoftlandSyncPanel />
    </>
  );
}
