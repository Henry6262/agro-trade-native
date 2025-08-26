"use client"

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import {
  ChevronRight,
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Bell,
  RefreshCw,
  Wheat,
  ShoppingCart,
  Truck,
  UserPlus,
  Menu,
  Link,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { DashboardStackParamList } from '../../navigation/types';
import CommandCenterScreen from './CommandCenterScreen';
import AgentNetworkScreen from './AgentNetworkScreen';
import OperationsScreen from './OperationsScreen';
import IntelligenceScreen from './IntelligenceScreen';
import SellerDashboardScreen from './SellerDashboardScreen';
import BuyerDashboardScreen from './BuyerDashboardScreen';
import TransporterDashboardScreen from './TransporterDashboardScreen';

type DashboardMainScreenNavigationProp = StackNavigationProp<
  DashboardStackParamList,
  'DashboardMain'
>;
type DashboardMainScreenRouteProp = RouteProp<
  DashboardStackParamList,
  'DashboardMain'
>;

interface NavigationItem {
  id: string;
  icon: any;
  label: string;
}

export default function DashboardMainScreen() {
  const navigation = useNavigation<DashboardMainScreenNavigationProp>();
  const route = useRoute<DashboardMainScreenRouteProp>();
  const { width: screenWidth } = Dimensions.get('window');
  
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [userRole, setUserRole] = useState<'admin' | 'seller' | 'buyer' | 'transporter'>(
    route.params?.userRole || 'admin'
  );
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const getNavigationItems = (): NavigationItem[] => {
    if (userRole === 'seller') {
      return [
        { id: 'products', icon: Wheat, label: 'MY PRODUCTS' },
        { id: 'trades', icon: Package, label: 'MY TRADES' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET INTEL' },
      ];
    }
    if (userRole === 'buyer') {
      return [
        { id: 'orders', icon: ShoppingCart, label: 'MY ORDERS' },
        { id: 'requests', icon: Package, label: 'MY REQUESTS' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET INTEL' },
      ];
    }
    if (userRole === 'transporter') {
      return [
        { id: 'bidding', icon: Package, label: 'BIDDING' },
        { id: 'transfers', icon: Truck, label: 'MY TRANSFERS' },
        { id: 'fleet', icon: Users, label: 'MY FLEET' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET INTEL' },
      ];
    }
    // Admin navigation (default)
    return [
      { id: 'overview', icon: BarChart3, label: 'ORDER CENTER' },
      { id: 'agents', icon: Users, label: 'NETWORK' },
      { id: 'operations', icon: Package, label: 'TRADE OPS' },
      { id: 'intelligence', icon: TrendingUp, label: 'MARKET INTEL' },
    ];
  };

  const navigationItems = getNavigationItems();

  const handleRoleChange = (newRole: 'admin' | 'seller' | 'buyer' | 'transporter') => {
    setUserRole(newRole);
    if (newRole === 'seller') {
      setActiveSection('products');
    } else if (newRole === 'buyer') {
      setActiveSection('orders');
    } else if (newRole === 'transporter') {
      setActiveSection('bidding');
    } else {
      setActiveSection('overview');
    }
    setShowRoleSelector(false);
  };

  const renderContent = () => {
    if (userRole === 'seller') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      return <SellerDashboardScreen activeTab={activeSection} />;
    }
    if (userRole === 'buyer') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      return <BuyerDashboardScreen activeTab={activeSection} />;
    }
    if (userRole === 'transporter') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      return <TransporterDashboardScreen activeTab={activeSection} />;
    }
    // Admin content
    if (activeSection === 'overview') return <CommandCenterScreen />;
    if (activeSection === 'agents') return <AgentNetworkScreen />;
    if (activeSection === 'operations') return <OperationsScreen />;
    if (activeSection === 'intelligence') return <IntelligenceScreen />;
    return <CommandCenterScreen />;
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', icon: Users },
    { value: 'seller', label: 'Seller', icon: Wheat },
    { value: 'buyer', label: 'Buyer', icon: ShoppingCart },
    { value: 'transporter', label: 'Transporter', icon: Truck },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      <View className="flex-1">
        {/* Desktop Sidebar - Always shown on desktop/tablet */}
        {screenWidth >= 768 && (
          <View
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 50 }}
            className={`${
              sidebarCollapsed ? 'w-16' : 'w-70'
            } bg-neutral-900 border-r border-neutral-700`}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-8">
                <View className={`${sidebarCollapsed ? 'hidden' : 'flex'}`}>
                  <Text className="text-green-500 font-bold text-lg tracking-wider">
                    AGRI TRADE
                  </Text>
                  <Text className="text-neutral-500 text-xs">v1.0.0 PLATFORM</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2"
                >
                  <ChevronRight
                    color="#9CA3AF"
                    size={20}
                    style={{
                      transform: [{ rotate: sidebarCollapsed ? '0deg' : '180deg' }],
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setActiveSection(item.id)}
                      className={`w-full flex-row items-center gap-3 p-3 rounded ${
                        activeSection === item.id
                          ? 'bg-green-500'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        color={activeSection === item.id ? '#ffffff' : '#9CA3AF'}
                        size={20}
                      />
                      {!sidebarCollapsed && (
                        <Text
                          className={`text-sm font-medium ${
                            activeSection === item.id ? 'text-white' : 'text-neutral-400'
                          }`}
                        >
                          {item.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!sidebarCollapsed && (
                <View className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-2 h-2 bg-green-400 rounded-full" />
                    <Text className="text-xs text-white">PLATFORM ONLINE</Text>
                  </View>
                  <View>
                    <Text className="text-neutral-500 text-xs">UPTIME: 99.8%</Text>
                    <Text className="text-neutral-500 text-xs">ACTIVE TRADES: 47</Text>
                    <Text className="text-neutral-500 text-xs">MATCHES TODAY: 12</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Mobile Sidebar Overlay - Only shown on mobile when menu is opened */}
        {screenWidth < 768 && !sidebarCollapsed && (
          <>
            {/* Overlay backdrop */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 60,
              }}
              onPress={() => setSidebarCollapsed(true)}
            />
            
            {/* Mobile sidebar */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 280,
                zIndex: 70,
              }}
              className="bg-neutral-900 border-r border-neutral-700"
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-8">
                  <View>
                    <Text className="text-green-500 font-bold text-lg tracking-wider">
                      AGRI TRADE
                    </Text>
                    <Text className="text-neutral-500 text-xs">v1.0.0 PLATFORM</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSidebarCollapsed(true)}
                    className="p-2"
                  >
                    <ChevronRight
                      color="#9CA3AF"
                      size={20}
                      style={{
                        transform: [{ rotate: '180deg' }],
                      }}
                    />
                  </TouchableOpacity>
                </View>

                <View className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setActiveSection(item.id);
                          setSidebarCollapsed(true); // Close mobile sidebar after selection
                        }}
                        className={`w-full flex-row items-center gap-3 p-3 rounded ${
                          activeSection === item.id
                            ? 'bg-green-500'
                            : 'bg-transparent'
                        }`}
                      >
                        <Icon
                          color={activeSection === item.id ? '#ffffff' : '#9CA3AF'}
                          size={20}
                        />
                        <Text
                          className={`text-sm font-medium ${
                            activeSection === item.id ? 'text-white' : 'text-neutral-400'
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-2 h-2 bg-green-400 rounded-full" />
                    <Text className="text-xs text-white">PLATFORM ONLINE</Text>
                  </View>
                  <View>
                    <Text className="text-neutral-500 text-xs">UPTIME: 99.8%</Text>
                    <Text className="text-neutral-500 text-xs">ACTIVE TRADES: 47</Text>
                    <Text className="text-neutral-500 text-xs">MATCHES TODAY: 12</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Main Content */}
        <View 
          className="flex-1"
          style={{
            marginLeft: screenWidth >= 768 ? (sidebarCollapsed ? 64 : 280) : 0,
            marginBottom: screenWidth < 768 ? 64 : 0, // Reserve space for fixed bottom nav
          }}
        >
          {/* Top Toolbar */}
          <View className="h-16 bg-neutral-800 border-b border-neutral-700 flex-row items-center justify-between px-6">
            <View className="flex-row items-center gap-4">
              {/* Mobile menu button - only show on mobile */}
              {screenWidth < 768 && (
                <TouchableOpacity
                  onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 mr-2"
                >
                  <Menu color="#9CA3AF" size={20} />
                </TouchableOpacity>
              )}
             
              <TouchableOpacity
                onPress={() => setShowRoleSelector(true)}
                className="flex-row items-center gap-2 px-3 py-1 bg-neutral-700 border border-neutral-600 rounded"
              >
                {(() => {
                  const roleOption = roleOptions.find(r => r.value === userRole);
                  if (roleOption) {
                    const Icon = roleOption.icon;
                    return (
                      <View className="flex-row items-center gap-2">
                        <Icon color="#9CA3AF" size={12} />
                        <Text className="text-xs text-white capitalize">{userRole}</Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity 
                onPress={() => navigation.navigate('RoleSelection' as any)}
                className="flex-row items-center gap-2 px-3 py-1.5 border border-green-500 rounded"
              >
                <UserPlus color="#22C55E" size={16} />
                <Text className="text-green-500 text-xs">Start Onboarding</Text>
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <Bell color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <RefreshCw color="#9CA3AF" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Content */}
          <View className="flex-1">
            {renderContent()}
          </View>
        </View>

        {/* Fixed Bottom Navigation for Mobile - Always Visible */}
        {screenWidth < 768 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              backgroundColor: '#171717',
              borderTopWidth: 1,
              borderTopColor: '#404040',
              zIndex: 100,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 10,
            }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View 
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  paddingHorizontal: 8,
                }}
              >
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setActiveSection(item.id)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 4,
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}
                      >
                        <Icon
                          color={isActive ? '#22c55e' : '#6b7280'}
                          size={20}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            marginTop: 4,
                            color: isActive ? '#22c55e' : '#6b7280',
                            fontWeight: isActive ? '600' : '400',
                          }}
                          numberOfLines={1}
                        >
                          {item.label.length > 10 ? item.label.split(' ')[0] : item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SafeAreaView>
          </View>
        )}
      </View>

      {/* Role Selector Modal */}
      <Modal
        visible={showRoleSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleSelector(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center"
          activeOpacity={1}
          onPress={() => setShowRoleSelector(false)}
        >
          <View className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 mx-6 w-64">
            <Text className="text-white text-lg font-semibold mb-4">Select Role</Text>
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => handleRoleChange(role.value as any)}
                  className={`flex-row items-center gap-3 p-3 rounded mb-2 ${
                    userRole === role.value ? 'bg-green-500' : 'bg-neutral-700'
                  }`}
                >
                  <Icon
                    color={userRole === role.value ? '#ffffff' : '#9CA3AF'}
                    size={16}
                  />
                  <Text
                    className={`text-sm ${
                      userRole === role.value ? 'text-white' : 'text-neutral-300'
                    }`}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}