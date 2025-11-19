import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Search, Filter, MapPin, Users, Truck, ShoppingCart, Wheat, X } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AgentNetworkScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');

  const users = [
    {
      id: 'F-078W',
      name: 'Green Valley Farms',
      type: 'farmer',
      location: 'Iowa, USA',
      lastActive: '2 min ago',
      trades: 47,
      rating: 4.8,
      products: ['Corn', 'Soybeans'],
    },
    {
      id: 'B-079X',
      name: 'Fresh Market Co',
      type: 'buyer',
      location: 'Chicago, IL',
      lastActive: '15 min ago',
      trades: 32,
      rating: 4.5,
      products: ['Vegetables', 'Grains'],
    },
    {
      id: 'F-080Y',
      name: 'Sunrise Orchards',
      type: 'farmer',
      location: 'California, USA',
      lastActive: '1 min ago',
      trades: 63,
      rating: 4.9,
      products: ['Apples', 'Citrus'],
    },
    {
      id: 'T-081Z',
      name: 'Swift Transport LLC',
      type: 'transporter',
      location: 'Texas, USA',
      lastActive: '3 hours ago',
      trades: 28,
      rating: 4.2,
      products: ['Refrigerated', 'Bulk'],
    },
    {
      id: 'B-082A',
      name: 'Global Food Distributors',
      type: 'buyer',
      location: 'New York, NY',
      lastActive: '5 min ago',
      trades: 41,
      rating: 4.6,
      products: ['Organic', 'Processed'],
    },
    {
      id: 'F-083B',
      name: 'Prairie Wheat Co',
      type: 'farmer',
      location: 'Kansas, USA',
      lastActive: '1 day ago',
      trades: 12,
      rating: 4.3,
      products: ['Wheat', 'Barley'],
    },
    {
      id: 'B-084C',
      name: 'Restaurant Supply Chain',
      type: 'buyer',
      location: 'Los Angeles, CA',
      lastActive: '8 min ago',
      trades: 55,
      rating: 4.7,
      products: ['Fresh Produce', 'Dairy'],
    },
    {
      id: 'T-085D',
      name: 'AgriLogistics Pro',
      type: 'transporter',
      location: 'Florida, USA',
      lastActive: '22 min ago',
      trades: 38,
      rating: 4.4,
      products: ['Temperature Controlled', 'Express'],
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;

    return matchesSearch && matchesType;
  });

  const getUserTypeIcon = (type: string, size = 16) => {
    const iconProps = { width: size, height: size };
    switch (type) {
      case 'farmer':
        return <Wheat {...iconProps} color="#22c55e" />;
      case 'buyer':
        return <ShoppingCart {...iconProps} color="#3b82f6" />;
      case 'transporter':
        return <Truck {...iconProps} color="#f97316" />;
      default:
        return <Users {...iconProps} color="#a3a3a3" />;
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6 space-y-6">
          {/* Header */}
          <View
            className={`${screenWidth >= 768 ? 'flex-row justify-between items-center' : 'space-y-4'}`}
          >
            <View>
              <Text className="text-2xl font-bold text-white tracking-wider">NETWORK</Text>
              <Text className="text-sm text-neutral-400">
                Manage farmers, buyers, and transporters
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center">
                <Text className="text-white font-medium">Add User</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center">
                <Filter width={16} height={16} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-medium">Filter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search and Stats */}
          <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-2'} gap-2`}>
            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <View className="relative">
                <Search
                  width={16}
                  height={16}
                  color="#a3a3a3"
                  style={{ position: 'absolute', left: 12, top: 10, zIndex: 1 }}
                />
                <TextInput
                  placeholder="Search..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholderTextColor="#a3a3a3"
                  className="pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-sm"
                />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">FARMERS</Text>
                  <Text className="text-2xl font-bold text-white font-mono">247</Text>
                </View>
                <Users width={32} height={32} color="#22c55e" />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">BUYERS</Text>
                  <Text className="text-2xl font-bold text-blue-500 font-mono">183</Text>
                </View>
                <Users width={32} height={32} color="#3b82f6" />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">TRANSPORT</Text>
                  <Text className="text-2xl font-bold text-orange-500 font-mono">45</Text>
                </View>
                <Users width={32} height={32} color="#f97316" />
              </View>
            </View>
          </View>

          {/* User List */}
          <View className="bg-neutral-900 border border-neutral-700 rounded-lg">
            <View className="p-4 border-b border-neutral-700">
              <Text className="text-sm font-medium text-neutral-300 tracking-wider">
                NETWORK DIRECTORY
              </Text>
            </View>
            <View>
              {/* Table Header */}
              <View className="flex-row border-b border-neutral-700 px-4 py-3">
                <View className="w-12">
                  <Text className="text-xs font-medium text-neutral-400 tracking-wider">TYPE</Text>
                </View>
                <View className="flex-1 px-2">
                  <Text className="text-xs font-medium text-neutral-400 tracking-wider">NAME</Text>
                </View>
                <View className="flex-1 px-2">
                  <Text className="text-xs font-medium text-neutral-400 tracking-wider">
                    LOCATION
                  </Text>
                </View>
                <View className="w-16 px-2">
                  <Text className="text-xs font-medium text-neutral-400 tracking-wider">
                    TRADES
                  </Text>
                </View>
                <View className="w-16">
                  <Text className="text-xs font-medium text-neutral-400 tracking-wider">
                    RATING
                  </Text>
                </View>
              </View>

              {/* Table Body */}
              {filteredUsers.map((user, index) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => setSelectedUser(user)}
                  className={`flex-row border-b border-neutral-800 px-4 py-3 ${
                    index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-850'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-12 justify-center">{getUserTypeIcon(user.type)}</View>
                  <View className="flex-1 px-2 justify-center">
                    <Text className="text-sm text-white">{user.name}</Text>
                  </View>
                  <View className="flex-1 px-2 flex-row items-center">
                    <MapPin width={12} height={12} color="#a3a3a3" style={{ marginRight: 4 }} />
                    <Text className="text-sm text-neutral-300">{user.location}</Text>
                  </View>
                  <View className="w-16 px-2 justify-center">
                    <Text className="text-sm text-white font-mono">{user.trades}</Text>
                  </View>
                  <View className="w-16 flex-row items-center">
                    <Text className="text-sm text-white font-mono">{user.rating}</Text>
                    <Text className="text-xs text-neutral-400 ml-1">★</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-2xl">
            <View className="flex-row items-center justify-between p-4 border-b border-neutral-700">
              <View>
                <Text className="text-lg font-bold text-white tracking-wider">
                  {selectedUser?.name}
                </Text>
                <Text className="text-sm text-neutral-400 font-mono">{selectedUser?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <X width={24} height={24} color="#a3a3a3" />
              </TouchableOpacity>
            </View>

            <View className="p-4 space-y-4">
              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <Text className="text-xs text-neutral-400 tracking-wider mb-1">TYPE</Text>
                  <View className="flex-row items-center">
                    {selectedUser && getUserTypeIcon(selectedUser.type)}
                    <Text className="text-sm text-white uppercase tracking-wider ml-2">
                      {selectedUser?.type}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 mb-4">
                  <Text className="text-xs text-neutral-400 tracking-wider mb-1">LOCATION</Text>
                  <Text className="text-sm text-white">{selectedUser?.location}</Text>
                </View>
                <View className="w-1/2 mb-4">
                  <Text className="text-xs text-neutral-400 tracking-wider mb-1">
                    COMPLETED TRADES
                  </Text>
                  <Text className="text-sm text-white font-mono">{selectedUser?.trades}</Text>
                </View>
                <View className="w-1/2 mb-4">
                  <Text className="text-xs text-neutral-400 tracking-wider mb-1">RATING</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-white font-mono">{selectedUser?.rating}</Text>
                    <Text className="text-xs text-neutral-400 ml-1">★</Text>
                  </View>
                </View>
                <View className="w-full">
                  <Text className="text-xs text-neutral-400 tracking-wider mb-1">
                    PRODUCTS/SERVICES
                  </Text>
                  <View className="flex-row flex-wrap gap-1">
                    {selectedUser?.products.map((product: string, idx: number) => (
                      <View key={idx} className="px-2 py-1 bg-neutral-800 rounded">
                        <Text className="text-xs text-neutral-300">{product}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2 pt-4">
                <TouchableOpacity className="flex-1 bg-green-600 px-4 py-2 rounded-lg">
                  <Text className="text-white text-center font-medium">Create Order</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 border border-neutral-700 px-4 py-2 rounded-lg">
                  <Text className="text-neutral-400 text-center">View History</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 border border-neutral-700 px-4 py-2 rounded-lg">
                  <Text className="text-neutral-400 text-center">Send Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
