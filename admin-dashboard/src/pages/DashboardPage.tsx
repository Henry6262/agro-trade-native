import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to operations page by default
    navigate('/operations', { replace: true });
  }, [navigate]);

  return null;
}
