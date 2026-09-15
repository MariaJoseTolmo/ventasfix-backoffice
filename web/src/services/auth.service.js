import apiClient from './apiClient';

async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
}

export default { login };
