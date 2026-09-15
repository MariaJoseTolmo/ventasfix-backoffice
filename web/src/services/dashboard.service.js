import apiClient from './apiClient';

async function summary() {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
}

export default { summary };
