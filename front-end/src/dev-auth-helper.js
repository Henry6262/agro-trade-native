// Development helper to set auth token
// This file should NOT be committed to production

export const DEV_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWY5c3B1eXAwMDAwNW5xc3B3cmJ3ZWVyIiwiaWF0IjoxNzU3NjEwNzY5LCJleHAiOjE3NTgyMTU1Njl9.L-Y6NnLz_amguhs9PcwURUws2AgQciTzScGu9ungpig';

export const DEV_USER = {
  id: 'cmf9spuyp00005nqspwrbweer',
  email: 'enriquemiloslavov10@gmail.com',
  name: 'Estoica chondo',
  role: 'BUYER',
};

// Function to set auth in dev mode
export const setDevAuth = (authStore) => {
  if (__DEV__) {
    authStore.setState({
      token: DEV_AUTH_TOKEN,
      user: DEV_USER,
      isAuthenticated: true,
    });
    console.log('Dev auth set successfully');
  }
};