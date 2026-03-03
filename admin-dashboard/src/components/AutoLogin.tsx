import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export default function AutoLogin({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      // Check if already has token
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Auto-login if enabled
      const enableAutoLogin = import.meta.env.VITE_ENABLE_AUTO_LOGIN === 'true';
      if (enableAutoLogin) {
        const email = import.meta.env.VITE_AUTO_LOGIN_EMAIL;
        const password = import.meta.env.VITE_AUTO_LOGIN_PASSWORD;

        if (email && password) {
          try {
            console.log('🔐 Auto-login: Authenticating...');
            const response = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/login`, {
              email,
              password,
            });

            const token = response.data.access_token;
            if (token) {
              localStorage.setItem('token', token);
              console.log('✅ Auto-login: Success');
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
          }
        }
      }

      setIsLoading(false);
    };

    authenticate();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔐</div>
          <div>Authenticating...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px', color: 'red' }}>❌</div>
          <div>Authentication failed</div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Check console for details
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
