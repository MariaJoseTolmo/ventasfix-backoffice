import apiClient from './apiClient';

async function list() {
  const response = await apiClient.get('/users');
  return response.data;
}

async function create(payload) {
  const response = await apiClient.post('/users', payload);
  return response.data;
}

async function update(id, payload) {
  const response = await apiClient.put(`/users/${id}`, payload);
  return response.data;
}

async function remove(id) {
  await apiClient.delete(`/users/${id}`);
}

export default { list, create, update, remove };
