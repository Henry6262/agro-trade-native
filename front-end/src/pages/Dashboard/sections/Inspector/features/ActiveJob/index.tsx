import React, { useState } from 'react';
import type { BaseComponentProps } from '@shared/types';
import { useInspectorActiveJob } from './hooks';
import { ActiveJobContent } from './components';
import InspectionExecution from '../InspectionExecution';

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
    refresh,
  } = useInspectorActiveJob();

  const [executingJob, setExecutingJob] = useState<{
    id: string;
    productName: string;
  } | null>(null);

  if (executingJob) {
    return (
      <InspectionExecution
        inspectionId={executingJob.id}
        productName={executingJob.productName}
        onComplete={() => {
          setExecutingJob(null);
          refresh?.();
        }}
        onBack={() => setExecutingJob(null)}
      />
    );
  }

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
      onExecuteInspection={
        job
          ? () =>
              setExecutingJob({
                id: job.id,
                productName: job.productDetails?.name ?? 'Product',
              })
          : undefined
      }
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

export default ActiveJobTab;
