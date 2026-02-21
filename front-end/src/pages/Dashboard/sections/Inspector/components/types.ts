import type {
  InspectorVerificationJob,
  InspectorLocationCoordinates,
} from '../features/ActiveJob/types';

export interface ActiveJobTabProps {
  activeJob: InspectorVerificationJob | null;
  currentLocation: InspectorLocationCoordinates | null;
  onStartVerification?: () => void;
  onCompleteVerification?: (result: any) => void;
}
