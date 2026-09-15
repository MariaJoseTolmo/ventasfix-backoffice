import apiClient from './apiClient';

// Products are multipart/form-data because create/update accept an image
// file. sale_price is never sent: the API rejects it with 422 because the
// schema is .strict() (docs/adr/ADR-009-precio-venta-derivado.md) — it is
// always derived server-side from net_price and TAX_RATE.
function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'sale_price' || value === undefined || value === null) return;
    formData.append(key, value);
  });
  return formData;
}

async function list() {
  const response = await apiClient.get('/products');
  return response.data;
}

async function create(payload) {
  const response = await apiClient.post('/products', toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

async function update(id, payload) {
  const response = await apiClient.put(`/products/${id}`, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

async function remove(id) {
  await apiClient.delete(`/products/${id}`);
}

export default { list, create, update, remove };
