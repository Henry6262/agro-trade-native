import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  Truck,
  CheckCircle,
  Shield,
  Route,
  Plus,
  User,
  MapPin,
  Users,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { FleetCreationFlow } from '../fleet-creation';

interface TransporterFleetTabProps extends BaseComponentProps {
  id?: string;
}


interface FleetTruck {
  id: string;
  licensePlate: string;
  model: string;
  capacity: string;
  status: 'available' | 'assigned';
  location: string;
  verified: boolean;
  driver?: string;
  assignment?: string;
}

interface FleetDriver {
  id: string;
  name: string;
  license: string;
  phone: string;
  status: 'available' | 'assigned';
  experience: string;
  assignment?: string;
}

export const TransporterFleetTab: React.FC<TransporterFleetTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const [showFleetCreation, setShowFleetCreation] = useState(false);
  const [truckTab, setTruckTab] = useState<'available' | 'in_transit'>('available');
  const [driverTab, setDriverTab] = useState<'available' | 'assigned'>('available');

  const mockTrucks: FleetTruck[] = [
    {
      id: "T001",
      licensePlate: "ABC-1234",
      model: "Volvo FH16",
      capacity: "40 tons",
      status: "available",
      location: "Chicago, IL 🇺🇸",
      verified: true,
    },
    {
      id: "T002",
      licensePlate: "DEF-5678",
      model: "Mercedes Actros",
      capacity: "35 tons",
      status: "assigned",
      location: "En route to Kansas 🇺🇸",
      verified: true,
      driver: "Mike Johnson",
      assignment: "Wheat Transport - Iowa to Chicago",
    },
    {
      id: "T003",
      licensePlate: "GHI-9012",
      model: "Scania R500",
      capacity: "45 tons",
      status: "assigned",
      location: "Milwaukee, WI 🇺🇸",
      verified: true,
      driver: "Sarah Davis",
      assignment: "Corn Transport - Wisconsin to Kansas",
    },
    {
      id: "T004",
      licensePlate: "JKL-3456",
      model: "Peterbilt 579",
      capacity: "38 tons",
      status: "available",
      location: "Des Moines, IA 🇺🇸",
      verified: false,
    },
  ];

  const mockDrivers: FleetDriver[] = [
    {
      id: "D001",
      name: "John Smith",
      license: "CDL123456789",
      phone: "+1 (555) 123-4567",
      status: "available",
      experience: "8 years",
    },
    {
      id: "D002",
      name: "Mike Johnson",
      license: "CDL987654321",
      phone: "+1 (555) 987-6543",
      status: "assigned",
      experience: "12 years",
      assignment: "Truck DEF-5678",
    },
    {
      id: "D003",
      name: "Sarah Davis",
      license: "CDL456789123",
      phone: "+1 (555) 456-7890",
      status: "assigned",
      experience: "6 years",
      assignment: "Truck GHI-9012",
    },
  ];

  // Filter trucks based on selected tab
  const filteredTrucks = mockTrucks.filter(truck => {
    if (truckTab === 'available') {
      return truck.status === 'available';
    } else {
      return truck.status === 'assigned';
    }
  });

  // Filter drivers based on selected tab
  const filteredDrivers = mockDrivers.filter(driver => {
    if (driverTab === 'available') {
      return driver.status === 'available';
    } else {
      return driver.status === 'assigned';
    }
  });

  // Count calculations
  const availableTrucksCount = mockTrucks.filter(t => t.status === 'available').length;
  const inTransitTrucksCount = mockTrucks.filter(t => t.status === 'assigned').length;
  const availableDriversCount = mockDrivers.filter(d => d.status === 'available').length;
  const assignedDriversCount = mockDrivers.filter(d => d.status === 'assigned').length;

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="p-4 space-y-4">
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="TOTAL TRUCKS"
              value="12"
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
              value="8"
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
              value="4"
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
              value="10"
              icon={Shield}
              gradient="from-purple-500/10 to-purple-600/5"
              borderColor="border-purple-500/20"
              iconColor="#A78BFA"
              valueColor="text-purple-400"
            />
          </View>
        </View>

        {/* Action Button - Single Entry Point */}
        <View className="mb-4">
          <Button
            variant="gradient"
            className="bg-gradient-to-r from-purple-600 to-purple-700 w-full"
            onPress={() => setShowFleetCreation(true)}
          >
            <View className="flex-row items-center justify-center">
              <Users size={20} color="#FFFFFF" />
              <Text className="ml-2 text-white font-semibold text-base">ADD TO FLEET</Text>
            </View>
          </Button>
        </View>

        {/* Fleet List Section */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Truck size={20} color="#34D399" />
              <Text className="text-lg font-semibold text-green-400 ml-2">MY FLEET</Text>
            </View>
          </View>

          {/* Truck Tab Selector */}
          <View className="flex-row bg-neutral-800 rounded-lg p-1 mb-4">
            <TouchableOpacity
              onPress={() => setTruckTab('available')}
              className={`flex-1 py-2 px-4 rounded-md ${
                truckTab === 'available' ? 'bg-green-500' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-semibold ${
                truckTab === 'available' ? 'text-white' : 'text-neutral-400'
              }`}>
                Available ({availableTrucksCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTruckTab('in_transit')}
              className={`flex-1 py-2 px-4 rounded-md ${
                truckTab === 'in_transit' ? 'bg-yellow-500' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-semibold ${
                truckTab === 'in_transit' ? 'text-white' : 'text-neutral-400'
              }`}>
                In Transit ({inTransitTrucksCount})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredTrucks.length > 0 ? (
            filteredTrucks.map((truck) => (
            <View
              key={truck.id}
              className="border border-neutral-700 rounded-lg p-4 mb-3"
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg items-center justify-center border border-green-500/30">
                    <Truck size={20} color="#34D399" />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-bold text-white">{truck.licensePlate}</Text>
                      {truck.verified && <Shield size={16} color="#34D399" style={{ marginLeft: 8 }} />}
                    </View>
                    <Text className="text-sm text-neutral-400">
                      {truck.model} • {truck.capacity}
                    </Text>
                  </View>
                </View>
                <Badge variant={truck.status === "available" ? "secondary" : "default"}>
                  {truck.status.toUpperCase()}
                </Badge>
              </View>

              {/* Details */}
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <MapPin size={16} color="#60A5FA" />
                  <Text className="text-neutral-300 ml-2">{truck.location}</Text>
                </View>

                {truck.status === "assigned" && truck.driver && (
                  <>
                    <View className="flex-row items-center">
                      <User size={16} color="#FCD34D" />
                      <Text className="text-neutral-300 ml-2">Driver: {truck.driver}</Text>
                    </View>
                    {truck.assignment && (
                      <View className="flex-row items-center">
                        <Route size={16} color="#34D399" />
                        <Text className="text-neutral-300 ml-2">{truck.assignment}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Actions */}
              <View className="flex-row justify-end mt-3">
                <Button size="sm" variant="ghost" onPress={() => console.log('Edit truck')}>
                  <Text className="text-neutral-400">EDIT</Text>
                </Button>
              </View>
            </View>
          ))
          ) : (
            <View className="border border-neutral-700 rounded-lg p-8 items-center">
              <Truck size={48} color="#6B7280" />
              <Text className="text-neutral-400 mt-4 text-center">
                No {truckTab === 'available' ? 'available' : 'in transit'} trucks
              </Text>
            </View>
          )}
        </View>

        {/* Drivers List Section */}
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <User size={20} color="#60A5FA" />
            <Text className="text-lg font-semibold text-blue-400 ml-2">DRIVERS</Text>
          </View>

          {/* Driver Tab Selector */}
          <View className="flex-row bg-neutral-800 rounded-lg p-1 mb-4">
            <TouchableOpacity
              onPress={() => setDriverTab('available')}
              className={`flex-1 py-2 px-4 rounded-md ${
                driverTab === 'available' ? 'bg-blue-500' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-semibold ${
                driverTab === 'available' ? 'text-white' : 'text-neutral-400'
              }`}>
                Available ({availableDriversCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDriverTab('assigned')}
              className={`flex-1 py-2 px-4 rounded-md ${
                driverTab === 'assigned' ? 'bg-orange-500' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-semibold ${
                driverTab === 'assigned' ? 'text-white' : 'text-neutral-400'
              }`}>
                Assigned ({assignedDriversCount})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredDrivers.length > 0 ? (
            filteredDrivers.map((driver) => (
            <View
              key={driver.id}
              className="border border-neutral-700 rounded-lg p-4 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-blue-600/10 rounded-lg items-center justify-center border border-blue-500/30">
                    <User size={20} color="#60A5FA" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-white">{driver.name}</Text>
                    <Text className="text-sm text-neutral-400">{driver.experience} experience</Text>
                    {driver.assignment && (
                      <Text className="text-xs text-green-400">Assigned to: {driver.assignment}</Text>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  <Badge variant={driver.status === "available" ? "secondary" : "default"} className="mb-2">
                    {driver.status.toUpperCase()}
                  </Badge>
                  <Button size="sm" variant="ghost" onPress={() => console.log('Edit driver')}>
                    <Text className="text-neutral-400">EDIT</Text>
                  </Button>
                </View>
              </View>
            </View>
          ))
          ) : (
            <View className="border border-neutral-700 rounded-lg p-8 items-center">
              <User size={48} color="#6B7280" />
              <Text className="text-neutral-400 mt-4 text-center">
                No {driverTab === 'available' ? 'available' : 'assigned'} drivers
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Fleet Creation Flow */}
      <FleetCreationFlow
        visible={showFleetCreation}
        onClose={() => setShowFleetCreation(false)}
        onSuccess={(data) => {
          console.log('Fleet item added:', data);
          // TODO: Refresh fleet data
          // Don't need to set false here as onClose will be called
        }}
        onError={(error) => {
          console.error('Fleet creation error:', error);
        }}
      />
    </ScrollView>
  );
};