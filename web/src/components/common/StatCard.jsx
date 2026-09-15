import { Card, Skeleton, Statistic } from 'antd';

export default function StatCard({ title, value, loading, prefix }) {
  return (
    <Card>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Statistic title={title} value={value} prefix={prefix} />
      )}
    </Card>
  );
}
