import { AppLayout } from '../components/layout';
import { TransportManagement } from '../features/transport/components/TransportManagement/TransportManagement';

export function TransportPage() {
  return (
    <AppLayout fullWidth>
      <TransportManagement />
    </AppLayout>
  );
}
