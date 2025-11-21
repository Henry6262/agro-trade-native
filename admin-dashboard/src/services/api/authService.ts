import { axios, API_BASE } from './config';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('adminToken', response.data.access_token);
    }
    return response.data;
  },
};
