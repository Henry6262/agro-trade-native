import { AppLayout } from '../components/layout';
import { MatchingDashboard } from '../features/matching/components/MatchingDashboard/MatchingDashboard';

export function MatchingPage() {
  return (
    <AppLayout fullWidth>
      <MatchingDashboard />
    </AppLayout>
  );
}
