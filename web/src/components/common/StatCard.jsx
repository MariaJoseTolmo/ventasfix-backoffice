import { Card, Skeleton, Statistic, Typography } from 'antd';

// `accent` marks the one tile whose value is derived/computed on the front
// (Inventory value), rather than coming straight from the API.
export default function StatCard({ title, value, loading, prefix, footer, accent = false, mono = false }) {
  return (
    <Card style={accent ? { borderLeft: '4px solid #0d6e66' } : undefined}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <>
          {/* The icon sits next to the label, not next to the value: an icon rendered
              at value size competes with the figure the tile exists to show. */}
          <Statistic
            title={
              prefix ? (
                <span className="vf-stat-title">
                  <span className="vf-stat-icon">{prefix}</span>
                  {title}
                </span>
              ) : (
                title
              )
            }
            value={value}
            valueStyle={mono ? { fontFamily: 'var(--vf-font-mono)', fontVariantNumeric: 'tabular-nums' } : undefined}
          />
          {footer && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {footer}
            </Typography.Text>
          )}
        </>
      )}
    </Card>
  );
}
