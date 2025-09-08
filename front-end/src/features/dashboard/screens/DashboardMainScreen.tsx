"use client"

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
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
  Menu,
  Link,
  User,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardStackParamList } from '../../../navigation/types';
import CommandCenterScreen from './admin/CommandCenterScreen';
import AgentNetworkScreen from './admin/AgentNetworkScreen';
import OperationsScreen from './admin/OperationsScreen';
import IntelligenceScreen from './shared/IntelligenceScreen';
import SellerDashboardScreen from './seller/SellerDashboardScreen';
import BuyerDashboardScreen from './buyer/BuyerDashboardScreen';
import TransporterDashboardScreen from './transporter/TransporterDashboardScreen';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { useAuthStore } from '../../../stores/auth.store';
import { AdminPricingZonesScreen } from '../../admin/screens/AdminPricingZonesScreen';
import { Container } from '../../../shared/components';

type DashboardMainScreenNavigationProp = NativeStackNavigationProp<
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
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed
  // Normalize user role to lowercase for consistency
  // Note: Backend uses 'FARMER' instead of 'SELLER'
  const userRole = React.useMemo(() => {
    const role = user?.role || route.params?.userRole || 'FARMER';
    const normalizedRole = role.toLowerCase();
    // Map 'farmer' to 'seller' for consistency with frontend naming
    if (normalizedRole === 'farmer') {
      return 'seller' as const;
    }
    return normalizedRole as 'admin' | 'seller' | 'buyer' | 'transporter';
  }, [user?.role, route.params?.userRole]);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Ensure authenticated users stay on dashboard
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('RoleSelection' as never);
    }
    
    // Check if we're coming from onboarding with success animation
    if (route.params?.showSuccessAnimation) {
      setShowProfileDrawer(true);
      setShowSuccessAnimation(true);
    }
  }, [isAuthenticated, route.params]);

  // Update active section when role changes
  React.useEffect(() => {
    switch (userRole) {
      case 'seller': 
        setActiveSection('products');
        break;
      case 'buyer': 
        setActiveSection('orders');
        break;
      case 'transporter': 
        setActiveSection('bidding');
        break;
      default: 
        setActiveSection('overview');
    }
  }, [userRole]);

  const getNavigationItems = (): NavigationItem[] => {
    if (userRole === 'seller') {
      return [
        { id: 'products', icon: Wheat, label: 'MY PRODUCTS' },
        { id: 'offers', icon: Bell, label: 'MY OFFERS' },
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
      { id: 'pricing', icon: BarChart3, label: 'PRICING ZONES' },
    ];
  };

  const navigationItems = getNavigationItems();
  
  // Debug logging
  console.log('Dashboard State:', {
    userRole,
    activeSection,
    navigationItems: navigationItems.map(i => i.id),
    isAuthenticated,
    user: user?.email,
  });


  const renderContent = () => {
    if (userRole === 'seller') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      // Pass all seller tabs to SellerDashboardScreen (products, offers, trades)
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
    if (activeSection === 'pricing') return <AdminPricingZonesScreen />;
    return <CommandCenterScreen />;
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', icon: Users },
    { value: 'seller', label: 'Seller', icon: Wheat },
    { value: 'buyer', label: 'Buyer', icon: ShoppingCart },
    { value: 'transporter', label: 'Transporter', icon: Truck },
  ];

  return (
    <Container safeArea={true} noPadding={true} backgroundColor="#000000">
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
                      onPress={() => {
                        console.log('Desktop nav clicked:', item.id);
                        setActiveSection(item.id);
                      }}
                      className={`w-full flex-row items-center gap-3 p-3 rounded ${
                        activeSection === item.id
                          ? 'bg-green-500'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        color={activeSection === item.id ? '#ffffff' : '#9CA3AF'}
                        size={24}
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
                          console.log('Mobile nav clicked:', item.id);
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
                          size={24}
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
          }}
        >
          {/* Top Toolbar */}
          <View className="h-16 bg-neutral-800 border-b border-neutral-700 flex-row items-center justify-between px-6">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2"
              >
                <Menu color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity className="p-2">
                <Bell color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <RefreshCw color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity 
                className="p-2 ml-2"
                onPress={() => setShowProfileDrawer(true)}
              >
                <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                  <User color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Content */}
          <View className="flex-1">
            {renderContent()}
          </View>
        </View>

      </View>

      
      {/* Profile Drawer */}
      <ProfileDrawer 
        visible={showProfileDrawer}
        onClose={() => {
          setShowProfileDrawer(false);
          setShowSuccessAnimation(false);
        }}
        showSuccessAnimation={showSuccessAnimation}
      />
    </Container>
  );
}