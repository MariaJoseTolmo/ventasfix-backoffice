import { Alert, Button, Card, Col, Row, Typography } from 'antd';
import { TeamOutlined, ShoppingOutlined, ContactsOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons';
import StatCard from '../components/common/StatCard';
import StockGauge, { STOCK_STATUS_ORDER, stockStatus } from '../components/common/StockGauge';
import SoftlandSyncPanel from '../components/softland/SoftlandSyncPanel';
import { useDashboard } from '../hooks/useDashboard';
import { useProducts } from '../hooks/useProducts';
import { getErrorMessage } from '../utils/apiError';
import { formatCurrency } from '../utils/format';

function toThresholds(product) {
  return {
    current: product.current_stock,
    minimum: product.minimum_stock,
    low: product.low_stock,
    high: product.high_stock,
  };
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
  // Reuses the existing useProducts query (no new HTTP call) to compute the
  // inventory value tile and the "needs attention" panel.
  const { list } = useProducts();
  const products = list.data ?? [];
  // Guard against silently reporting "$0 inventory / all healthy" when the
  // products query itself failed — that would misinform rather than just
  // show nothing.
  const productsFailed = Boolean(list.error);

  const inventoryValue = products.reduce(
    (sum, product) => sum + Number(product.net_price) * Number(product.current_stock),
    0
  );

  const attention = products
    .map((product) => ({ product, ...stockStatus(toThresholds(product)) }))
    .filter((entry) => entry.status !== 'ok')
    .sort((a, b) => STOCK_STATUS_ORDER.indexOf(a.status) - STOCK_STATUS_ORDER.indexOf(b.status));

  return (
    <>
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
      {productsFailed && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Could not load product data"
          description={getErrorMessage(list.error)}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Retry
            </Button>
          }
        />
      )}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Users" value={data?.users} loading={isLoading} prefix={<TeamOutlined />} footer="Registered" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Products"
            value={data?.products}
            loading={isLoading}
            prefix={<ShoppingOutlined />}
            footer="In catalog"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Clients"
            value={data?.clients}
            loading={isLoading}
            prefix={<ContactsOutlined />}
            footer="Active companies"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Inventory value"
            value={list.isLoading || productsFailed ? undefined : formatCurrency(inventoryValue)}
            loading={list.isLoading}
            prefix={<WalletOutlined />}
            footer={productsFailed ? 'Unavailable' : 'Net, before VAT'}
            accent
            mono
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Needs attention">
            {productsFailed ? (
              <Typography.Text type="secondary">Product data unavailable</Typography.Text>
            ) : attention.length === 0 ? (
              <Typography.Text type="secondary">All products are within range</Typography.Text>
            ) : (
              attention.map(({ product }) => (
                <div key={product.id} className="attention-row">
                  <div>
                    <div>{product.name}</div>
                    <Typography.Text type="secondary" className="vf-mono" style={{ fontSize: 12 }}>
                      {product.sku}
                    </Typography.Text>
                  </div>
                  <StockGauge {...toThresholds(product)} />
                </div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <SoftlandSyncPanel />
        </Col>
      </Row>
    </>
  );
}
