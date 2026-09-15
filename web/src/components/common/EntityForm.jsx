import { useEffect, useMemo } from 'react';
import { Alert, Form, Input, InputNumber, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

// Maps API 422 details to form fields so the backend stays the single source of validation truth.
export default function EntityForm({ fields, initialValues, onSubmit, submitting, apiError, submitLabel = 'Save' }) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.resetFields();
    if (initialValues) form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  // Details whose `field` is not part of this form (or a 422 with no details
  // at all) can't be attached to an input. They are shown in a summary alert
  // instead of being silently dropped.
  const unmappedDetails = useMemo(() => {
    if (!apiError) return [];
    const fieldNames = new Set(fields.map((field) => field.name));
    return (apiError.details ?? []).filter((detail) => !fieldNames.has(detail.field));
  }, [apiError, fields]);

  useEffect(() => {
    if (!apiError?.details?.length) return;
    const fieldNames = new Set(fields.map((field) => field.name));
    form.setFields(
      apiError.details
        .filter((detail) => fieldNames.has(detail.field))
        .map((detail) => ({ name: detail.field, errors: [detail.message] }))
    );
  }, [apiError, fields, form]);

  const showSummary = apiError && (unmappedDetails.length > 0 || !apiError.details?.length);

  function renderControl(field) {
    if (field.type === 'password') {
      return <Input.Password placeholder={field.label} autoComplete="new-password" />;
    }
    if (field.type === 'number') {
      return <InputNumber style={{ width: '100%' }} min={field.min} placeholder={field.label} />;
    }
    if (field.type === 'textarea') {
      return <Input.TextArea rows={3} placeholder={field.label} />;
    }
    if (field.type === 'upload') {
      return (
        <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
          <Button icon={<UploadOutlined />}>Select image</Button>
        </Upload>
      );
    }
    return <Input placeholder={field.label} />;
  }

  function handleFinish(values) {
    const uploadField = fields.find((f) => f.type === 'upload');
    if (uploadField) {
      const fileList = values[uploadField.name];
      values[uploadField.name] = fileList?.[0]?.originFileObj ?? undefined;
    }
    onSubmit(values);
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues}>
      {showSummary && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={apiError.message}
          description={
            unmappedDetails.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {unmappedDetails.map((detail) => (
                  <li key={`${detail.field}-${detail.message}`}>{detail.message}</li>
                ))}
              </ul>
            ) : undefined
          }
        />
      )}
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={field.rules}
          extra={field.extra}
          valuePropName={field.type === 'upload' ? 'fileList' : 'value'}
          getValueFromEvent={field.type === 'upload' ? (e) => (Array.isArray(e) ? e : e?.fileList) : undefined}
        >
          {renderControl(field)}
        </Form.Item>
      ))}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
}
