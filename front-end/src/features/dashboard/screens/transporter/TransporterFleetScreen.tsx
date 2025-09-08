import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import {
  Truck,
  CheckCircle,
  Route,
  Shield,
  Plus,
  User,
  MapPin,
  ArrowLeft,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { Input } from '@shared/components/Input';
import { Modal } from '@shared/components/Modal';
import { MetricCard } from '../components/MetricCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList, 'TransporterFleet'>;

interface TruckData {
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

interface DriverData {
  id: string;
  name: string;
  license: string;
  phone: string;
  status: 'available' | 'assigned';
  experience: string;
  assignment?: string;
}

export default function TransporterFleetScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [newTruckData, setNewTruckData] = useState({
    licensePlate: '',
    model: '',
    capacity: '',
    year: '',
  });
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    license: '',
    phone: '',
    experience: '',
  });

  const mockTrucks: TruckData[] = [
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

  const mockDrivers: DriverData[] = [
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

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-neutral-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Fleet Management</Text>
          <Text className="text-sm text-neutral-400">Manage your trucks and drivers</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
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

          {/* Action Buttons */}
          <View className="flex-row">
            <Button
              variant="gradient"
              className="bg-gradient-to-r from-green-600 to-green-700 mr-2 flex-1"
              onPress={() => setShowAddTruck(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="ml-2 text-white font-semibold">ADD NEW TRUCK</Text>
            </Button>
            <Button
              variant="gradient"
              className="bg-gradient-to-r from-blue-600 to-blue-700 flex-1"
              onPress={() => setShowAddDriver(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="ml-2 text-white font-semibold">ADD NEW DRIVER</Text>
            </Button>
          </View>

          {/* Fleet List Section */}
          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <Truck size={20} color="#34D399" />
              <Text className="text-lg font-semibold text-green-400 ml-2">MY FLEET</Text>
            </View>

            {mockTrucks.map((truck) => (
              <View
                key={truck.id}
                className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 mb-3"
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
            ))}
          </View>

          {/* Drivers List Section */}
          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <User size={20} color="#60A5FA" />
              <Text className="text-lg font-semibold text-blue-400 ml-2">AVAILABLE DRIVERS</Text>
            </View>

            {mockDrivers.map((driver) => (
              <View
                key={driver.id}
                className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 mb-3"
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
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Truck Modal */}
      <Modal
        visible={showAddTruck}
        onClose={() => setShowAddTruck(false)}
        title="Add New Truck"
      >
        <View className="space-y-4">
          <View>
            <Text className="text-sm text-neutral-400 mb-1">License Plate *</Text>
            <Input
              placeholder="ABC-1234"
              value={newTruckData.licensePlate}
              onChangeText={(text) => setNewTruckData({ ...newTruckData, licensePlate: text })}
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <View>
            <Text className="text-sm text-neutral-400 mb-1">Model</Text>
            <Input
              placeholder="Volvo FH16"
              value={newTruckData.model}
              onChangeText={(text) => setNewTruckData({ ...newTruckData, model: text })}
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-sm text-neutral-400 mb-1">Capacity (tons)</Text>
              <Input
                placeholder="40"
                value={newTruckData.capacity}
                onChangeText={(text) => setNewTruckData({ ...newTruckData, capacity: text })}
                keyboardType="numeric"
                className="bg-neutral-800 border-neutral-600"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-sm text-neutral-400 mb-1">Year</Text>
              <Input
                placeholder="2022"
                value={newTruckData.year}
                onChangeText={(text) => setNewTruckData({ ...newTruckData, year: text })}
                keyboardType="numeric"
                className="bg-neutral-800 border-neutral-600"
              />
            </View>
          </View>
          <Button
            variant="gradient"
            className="bg-gradient-to-r from-green-600 to-green-700 w-full"
            onPress={() => {
              setShowAddTruck(false);
              console.log('Submit for verification');
            }}
          >
            <Shield size={16} color="#FFFFFF" />
            <Text className="ml-2 text-white font-semibold">SUBMIT FOR VERIFICATION</Text>
          </Button>
        </View>
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        visible={showAddDriver}
        onClose={() => setShowAddDriver(false)}
        title="Add New Driver"
      >
        <View className="space-y-4">
          <View>
            <Text className="text-sm text-neutral-400 mb-1">Driver Name</Text>
            <Input
              placeholder="John Smith"
              value={newDriverData.name}
              onChangeText={(text) => setNewDriverData({ ...newDriverData, name: text })}
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <View>
            <Text className="text-sm text-neutral-400 mb-1">License Number</Text>
            <Input
              placeholder="CDL123456789"
              value={newDriverData.license}
              onChangeText={(text) => setNewDriverData({ ...newDriverData, license: text })}
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <View>
            <Text className="text-sm text-neutral-400 mb-1">Phone Number</Text>
            <Input
              placeholder="+1 (555) 123-4567"
              value={newDriverData.phone}
              onChangeText={(text) => setNewDriverData({ ...newDriverData, phone: text })}
              keyboardType="phone-pad"
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <View>
            <Text className="text-sm text-neutral-400 mb-1">Experience</Text>
            <Input
              placeholder="8 years"
              value={newDriverData.experience}
              onChangeText={(text) => setNewDriverData({ ...newDriverData, experience: text })}
              className="bg-neutral-800 border-neutral-600"
            />
          </View>
          <Button
            variant="gradient"
            className="bg-gradient-to-r from-blue-600 to-blue-700 w-full"
            onPress={() => {
              setShowAddDriver(false);
              console.log('Add driver');
            }}
          >
            <User size={16} color="#FFFFFF" />
            <Text className="ml-2 text-white font-semibold">ADD DRIVER</Text>
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}