import apiClient from './apiClient';

async function list() {
  const response = await apiClient.get('/clients');
  return response.data;
}

async function create(payload) {
  const response = await apiClient.post('/clients', payload);
  return response.data;
}

async function update(id, payload) {
  const response = await apiClient.put(`/clients/${id}`, payload);
  return response.data;
}

async function remove(id) {
  await apiClient.delete(`/clients/${id}`);
}

export default { list, create, update, remove };
