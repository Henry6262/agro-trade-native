import { AppLayout } from '../components/layout';
import { ProfessionalScenarioRunner } from '../features/scenarios/components/ProfessionalScenarioRunner';

export function ScenariosPage() {
  return (
    <AppLayout fullWidth>
      <ProfessionalScenarioRunner />
    </AppLayout>
  );
}
