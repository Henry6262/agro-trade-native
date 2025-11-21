import React from 'react';
import type { BaseComponentProps } from '@shared/types';
import { useInspectorActiveJob } from './hooks';
import { ActiveJobContent } from './components';

interface InspectorActiveJobTabProps extends BaseComponentProps {
  id?: string;
}

export const ActiveJobTab: React.FC<InspectorActiveJobTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    job,
    isLoading,
    error,
    currentLocation,
    showVerificationForm,
    startVerification,
    cancelVerification,
    submitVerification,
  } = useInspectorActiveJob();

  return (
    <ActiveJobContent
      job={job}
      isLoading={isLoading}
      error={error}
      currentLocation={currentLocation}
      showVerificationForm={showVerificationForm}
      onStartVerification={startVerification}
      onCancelVerification={cancelVerification}
      onSubmitVerification={submitVerification}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

export default ActiveJobTab;
