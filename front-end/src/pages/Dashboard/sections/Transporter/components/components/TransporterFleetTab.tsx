import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Truck, CheckCircle, Shield, Route, Plus, User, MapPin, Users } from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { FleetCreationFlow } from '@features/dashboard/screens/transporter/fleet-creation';
import { useTransporterFleet } from '../../../features/Fleet/hooks';

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
    isLoading,
    showFleetCreation,
    setTruckTab,
    setDriverTab,
    openFleetCreation,
    closeFleetCreation,
  } = useTransporterFleet();

  if (isLoading && filteredTrucks.length === 0 && filteredDrivers.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center" testID={testID}>
        <ActivityIndicator size="large" color="#fb923c" />
        <Text className="text-neutral-400 mt-3">Loading fleet overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="p-4 space-y-4">
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="TOTAL TRUCKS"
              value={summary.totalTrucks.toString()}
              icon={Truck}
              gradient="from-blue-500/10 to-blue-600/5"
              borderColor="border-blue-500/20"
              iconColor="#60A5FA"
              valueColor="text-blue-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="AVAILABLE"
              value={summary.availableTrucks.toString()}
              icon={CheckCircle}
              gradient="from-green-500/10 to-green-600/5"
              borderColor="border-green-500/20"
              iconColor="#34D399"
              valueColor="text-green-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="IN TRANSIT"
              value={summary.inTransitTrucks.toString()}
              icon={Route}
              gradient="from-yellow-500/10 to-yellow-600/5"
              borderColor="border-yellow-500/20"
              iconColor="#FCD34D"
              valueColor="text-yellow-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="VERIFIED"
              value={summary.verifiedTrucks.toString()}
              icon={Shield}
              gradient="from-purple-500/10 to-purple-600/5"
              borderColor="border-purple-500/20"
              iconColor="#A78BFA"
              valueColor="text-purple-400"
            />
          </View>
        </View>

        <View className="bg-neutral-900 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white font-semibold text-lg">Fleet</Text>
              <Text className="text-neutral-400 text-sm">Manage your trucks and drivers</Text>
            </View>
            <Button size="sm" onPress={openFleetCreation}>
              <Plus size={16} color="#111" />
              <Text className="text-black font-semibold ml-1">Add Asset</Text>
            </Button>
          </View>

          <View className="flex-row justify-between mb-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg mr-2 ${
                truckTab === 'available' ? 'bg-green-600' : 'bg-neutral-800'
              }`}
              onPress={() => setTruckTab('available')}
            >
              <Text
                className={`text-center font-semibold ${
                  truckTab === 'available' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                Available ({summary.availableTrucks})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                truckTab === 'in_transit' ? 'bg-yellow-600' : 'bg-neutral-800'
              }`}
              onPress={() => setTruckTab('in_transit')}
            >
              <Text
                className={`text-center font-semibold ${
                  truckTab === 'in_transit' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                In Transit ({summary.inTransitTrucks})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredTrucks.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-neutral-400">No trucks in this category yet.</Text>
            </View>
          ) : (
            filteredTrucks.map((truck) => (
              <View
                key={truck.id}
                className="bg-neutral-800 rounded-xl p-3 flex-row items-start justify-between mb-2"
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Truck color="#60A5FA" size={18} />
                    <Text className="text-white font-semibold ml-2">{truck.model}</Text>
                  </View>
                  <Text className="text-neutral-300 text-sm">{truck.licensePlate}</Text>
                  <Text className="text-neutral-400 text-xs mt-1">
                    Capacity: {truck.capacityTons} tons
                  </Text>
                  <Text className="text-neutral-400 text-xs">{truck.location}</Text>
                  {truck.driver && (
                    <Text className="text-neutral-200 text-xs mt-1">Driver: {truck.driver}</Text>
                  )}
                </View>
                <Badge className={truck.status === 'available' ? 'bg-green-600' : 'bg-yellow-600'}>
                  {truck.status === 'available' ? 'Available' : 'Assigned'}
                </Badge>
              </View>
            ))
          )}
        </View>

        <View className="bg-neutral-900 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white font-semibold text-lg">Drivers</Text>
              <Text className="text-neutral-400 text-sm">Availability overview</Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-sm font-semibold">
                {summary.availableDrivers} available
              </Text>
              <Text className="text-neutral-400 text-xs">
                {summary.assignedDrivers} assigned
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg mr-2 ${
                driverTab === 'available' ? 'bg-blue-600' : 'bg-neutral-800'
              }`}
              onPress={() => setDriverTab('available')}
            >
              <Text
                className={`text-center font-semibold ${
                  driverTab === 'available' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                Available ({summary.availableDrivers})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                driverTab === 'assigned' ? 'bg-purple-600' : 'bg-neutral-800'
              }`}
              onPress={() => setDriverTab('assigned')}
            >
              <Text
                className={`text-center font-semibold ${
                  driverTab === 'assigned' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                Assigned ({summary.assignedDrivers})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredDrivers.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-neutral-400">No drivers in this category.</Text>
            </View>
          ) : (
            filteredDrivers.map((driver) => (
              <View
                key={driver.id}
                className="bg-neutral-800 rounded-xl p-3 flex-row items-start justify-between mb-2"
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <User color="#A78BFA" size={18} />
                    <Text className="text-white font-semibold ml-2">{driver.name}</Text>
                  </View>
                  <Text className="text-neutral-300 text-sm">{driver.license}</Text>
                  <Text className="text-neutral-400 text-xs mt-1">{driver.phone}</Text>
                  <Text className="text-neutral-400 text-xs">
                    Experience: {driver.experienceYears} years
                  </Text>
                  {driver.assignment && (
                    <Text className="text-neutral-200 text-xs mt-1">
                      Assignment: {driver.assignment}
                    </Text>
                  )}
                </View>
                <Badge className={driver.status === 'available' ? 'bg-blue-600' : 'bg-yellow-600'}>
                  {driver.status === 'available' ? 'Available' : 'Assigned'}
                </Badge>
              </View>
            ))
          )}

          <View className="flex-row justify-between mt-3">
            <View className="flex-row items-center space-x-2">
              <MapPin color="#fb923c" size={16} />
              <Text className="text-neutral-300 text-sm">
                Active routes: {summary.inTransitTrucks}
              </Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <Users color="#34d399" size={16} />
              <Text className="text-neutral-300 text-sm">
                Ready drivers: {summary.availableDrivers}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {showFleetCreation && (
        <FleetCreationFlow
          visible={showFleetCreation}
          onClose={closeFleetCreation}
          onSuccess={closeFleetCreation}
        />
      )}
    </ScrollView>
  );
};

export default TransporterFleetTab;
