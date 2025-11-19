'use client';

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
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Bell,
  RefreshCw,
  Wheat,
  ShoppingCart,
  Truck,
  User,
  LayoutGrid,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardStackParamList } from '../../../navigation/types';
import CommandCenterScreen from './admin/CommandCenterScreen';
import AgentNetworkScreen from './admin/AgentNetworkScreen';
import OperationsScreen from './admin/OperationsScreenRefactored';
import IntelligenceScreen from './shared/IntelligenceScreen';
import SellerDashboardSection from '../../../pages/Dashboard/sections/Seller';
import BuyerDashboardSection from '../../../pages/Dashboard/sections/Buyer';
import TransporterDashboardScreen from './transporter/TransporterDashboardScreen';
import { InspectorDashboard } from './inspector/InspectorDashboard';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuthStore } from '../../../stores/auth.store';
import { AdminPricingZonesScreen } from '../../admin/screens/AdminPricingZonesScreen';
import { Container } from '../../../shared/components';
import PendingListingService from '../../../services/pendingListingService';

type DashboardMainScreenNavigationProp = NativeStackNavigationProp<
  DashboardStackParamList,
  'DashboardMain'
>;
type DashboardMainScreenRouteProp = RouteProp<DashboardStackParamList, 'DashboardMain'>;

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
  // State for testing different dashboards
  const [testRole, setTestRole] = useState<
    'admin' | 'seller' | 'buyer' | 'transporter' | 'inspector' | null
  >(null);

  // Normalize user role to lowercase for consistency
  // Note: Backend uses 'FARMER' instead of 'SELLER'
  const userRole = React.useMemo(() => {
    // If testRole is set, use it (for testing purposes)
    if (testRole) {
      return testRole;
    }
    // Otherwise use the route param or user's actual role
    const role = route.params?.userRole || user?.role || 'FARMER';
    const normalizedRole = role.toLowerCase();
    // Map 'farmer' to 'seller' for consistency with frontend naming
    if (normalizedRole === 'farmer') {
      return 'seller' as const;
    }
    return normalizedRole as 'admin' | 'seller' | 'buyer' | 'transporter' | 'inspector';
  }, [user?.role, route.params?.userRole, testRole]);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showDashboardSwitcher, setShowDashboardSwitcher] = useState(false);

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

    // Check for pending buyer listings after authentication
    if (isAuthenticated) {
      const checkPendingListing = async () => {
        const processed = await PendingListingService.processPendingListing();
        if (processed) {
          console.log('Successfully processed pending buyer listing');
          // Optionally show a success message
        }
      };
      checkPendingListing();
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
      case 'inspector':
        setActiveSection('active');
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
        { id: 'offers', icon: Bell, label: 'INCOMING OFFERS' },
        { id: 'transfers', icon: Truck, label: 'MY TRANSFERS' },
        { id: 'fleet', icon: Users, label: 'MY FLEET' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET INTEL' },
      ];
    }
    if (userRole === 'inspector') {
      return [
        { id: 'active', icon: Package, label: 'ACTIVE JOB' },
        { id: 'available', icon: LayoutGrid, label: 'AVAILABLE JOBS' },
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
    navigationItems: navigationItems.map((i) => i.id),
    isAuthenticated,
    user: user?.email,
  });

  const renderContent = () => {
    if (userRole === 'seller') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      // Pass all seller tabs to SellerDashboardSection (products, offers, trades)
      return (
        <SellerDashboardSection activeTab={activeSection as 'products' | 'offers' | 'trades'} />
      );
    }
    if (userRole === 'buyer') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      return <BuyerDashboardSection activeTab={activeSection as 'orders' | 'requests'} />;
    }
    if (userRole === 'transporter') {
      if (activeSection === 'intelligence') {
        return <IntelligenceScreen />;
      }
      return <TransporterDashboardScreen activeTab={activeSection} />;
    }
    if (userRole === 'inspector') {
      // Inspector doesn't need activeTab - it handles its own tabs internally
      return <InspectorDashboard />;
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
    { value: 'inspector', label: 'Inspector', icon: User },
  ];

  return (
    <Container safeArea={true} noPadding={true} backgroundColor="#000000">
      <StatusBar backgroundColor="#000000" barStyle="light-content" />

      <View className="flex-1">
        {/* Main Content */}
        <View className="flex-1">
          {/* Top Toolbar */}
          <View className="h-16 bg-neutral-800 border-b border-neutral-700 flex-row items-center justify-between px-6">
            <View className="flex-row items-center gap-4">
              <Text className="text-green-500 font-bold text-lg tracking-wider">AGRI TRADE</Text>
            </View>
            <View className="flex-row items-center gap-4">
              {/* Dashboard Switcher Button */}
              <TouchableOpacity
                onPress={() => setShowDashboardSwitcher(!showDashboardSwitcher)}
                className="flex-row items-center bg-neutral-700 px-3 py-2 rounded-lg"
              >
                <LayoutGrid color="#9CA3AF" size={16} />
                <Text className="text-neutral-300 text-sm ml-2">Switch Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity className="p-2">
                <Bell color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <RefreshCw color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2 ml-2" onPress={() => setShowProfileDrawer(true)}>
                <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                  <User color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Switcher Dropdown */}
          {showDashboardSwitcher && (
            <View
              className="absolute top-16 right-6 bg-neutral-900 border border-neutral-700 rounded-lg p-2 z-50"
              style={{ minWidth: 200 }}
            >
              <Text className="text-neutral-400 text-xs px-3 py-1 mb-1">TEST DASHBOARDS</Text>

              <TouchableOpacity
                onPress={() => {
                  setShowDashboardSwitcher(false);
                  setTestRole('seller');
                  setActiveSection('products');
                }}
                className={`flex-row items-center px-3 py-2 rounded ${
                  userRole === 'seller' ? 'bg-neutral-800' : ''
                }`}
              >
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                <Text className="text-white">Seller Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDashboardSwitcher(false);
                  setTestRole('buyer');
                  setActiveSection('orders');
                }}
                className={`flex-row items-center px-3 py-2 rounded ${
                  userRole === 'buyer' ? 'bg-neutral-800' : ''
                }`}
              >
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                <Text className="text-white">Buyer Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDashboardSwitcher(false);
                  setTestRole('transporter');
                  setActiveSection('bidding');
                }}
                className={`flex-row items-center px-3 py-2 rounded ${
                  userRole === 'transporter' ? 'bg-neutral-800' : ''
                }`}
              >
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-white">Transporter Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDashboardSwitcher(false);
                  setTestRole('admin');
                  setActiveSection('overview');
                }}
                className={`flex-row items-center px-3 py-2 rounded ${
                  userRole === 'admin' ? 'bg-neutral-800' : ''
                }`}
              >
                <View className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                <Text className="text-white">Admin Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDashboardSwitcher(false);
                  setTestRole('inspector');
                  setActiveSection('active');
                }}
                className={`flex-row items-center px-3 py-2 rounded ${
                  userRole === 'inspector' ? 'bg-neutral-800' : ''
                }`}
              >
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-white">Inspector Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dashboard Content */}
          <View className="flex-1">{renderContent()}</View>
        </View>

        {/* Bottom Navigation */}
        <BottomNavigation
          items={navigationItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
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
