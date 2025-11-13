import { AppLayout } from '../components/layout';
import { InspectorOverview } from '../features/inspections/components/InspectorOverview/InspectorOverview';

export function InspectionsPage() {
  return (
    <AppLayout fullWidth>
      <InspectorOverview />
    </AppLayout>
  );
}
