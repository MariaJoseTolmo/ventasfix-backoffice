import apiClient from './apiClient';

async function sync() {
  const response = await apiClient.post('/softland/sync');
  return response.data;
}

export default { sync };
