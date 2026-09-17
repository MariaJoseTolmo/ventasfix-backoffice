import { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, isStatus } from '../utils/apiError';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleFinish(values) {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err) {
      if (isStatus(err, 401)) {
        setError('Invalid email or password');
      } else {
        setError(getErrorMessage(err, 'Could not sign in'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="login-brand-content">
          <span className="vf-logo-mark">VF</span>
          <Typography.Title level={2} style={{ color: '#ffffff', marginTop: 24, marginBottom: 4 }}>
            VentasFix
          </Typography.Title>
          <Typography.Text style={{ color: '#a9c9c7' }}>Backoffice</Typography.Text>
          <Typography.Title level={4} style={{ color: '#ffffff', marginTop: 32 }}>
            Run your catalog, clients and stock from one place
          </Typography.Title>
          <Typography.Text style={{ color: '#a9c9c7' }}>
            Users, products and clients, all managed from a single backoffice built for your team.
          </Typography.Text>
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-form-card">
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Sign in
          </Typography.Title>
          <Typography.Text type="secondary">Use your @ventasfix.cl corporate email</Typography.Text>
          {error && <Alert type="error" message={error} showIcon style={{ margin: '16px 0' }} />}
          <Form layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={submitting}>
                Sign in
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
