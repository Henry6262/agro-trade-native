import React from 'react';
import { ScrollView, View } from 'react-native';
import type { BaseComponentProps } from '@shared/types';
import { FleetCreationFlow } from '../../../../../../features/dashboard/screens/transporter/fleet-creation';
import { useTransporterFleet } from './hooks';
import {
  FleetCreationCard,
  FleetDriversSection,
  FleetStatsGrid,
  FleetTrucksSection,
} from './components';

interface TransporterFleetTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterFleetTab: React.FC<TransporterFleetTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    summary,
    filteredTrucks,
    filteredDrivers,
    truckTab,
    driverTab,
    showFleetCreation,
    setTruckTab,
    setDriverTab,
    openFleetCreation,
    closeFleetCreation,
  } = useTransporterFleet();

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <View className="p-4 space-y-4">
          <FleetStatsGrid summary={summary} />
          <FleetCreationCard onCreate={openFleetCreation} />
          <FleetTrucksSection
            trucks={filteredTrucks}
            activeTab={truckTab as 'available' | 'in_transit'}
            onTabChange={setTruckTab}
          />
          <FleetDriversSection
            drivers={filteredDrivers}
            activeTab={driverTab}
            onTabChange={setDriverTab}
          />
        </View>
      </ScrollView>
      {showFleetCreation && (
        <FleetCreationFlow visible={showFleetCreation} onClose={closeFleetCreation} />
      )}
    </>
  );
};

export default TransporterFleetTab;
