'use client';

import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Bell,
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
import { useAuthStore } from '@stores/auth.store';
import { AdminPricingZonesScreen } from '../../admin/screens/AdminPricingZonesScreen';
import PendingListingService from '@services/pendingListingService';
import { GradientBackground, GlassHeader } from '../../../design-system';

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
  const { user, isAuthenticated } = useAuthStore();

  const [activeSection, setActiveSection] = useState('overview');

  // Normalize user role to lowercase for consistency
  // Note: Backend uses 'FARMER' instead of 'SELLER'
  const userRole = React.useMemo(() => {
    const role = route.params?.userRole || user?.role || 'FARMER';
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'farmer') {
      return 'seller' as const;
    }
    return normalizedRole as 'admin' | 'seller' | 'buyer' | 'transporter' | 'inspector';
  }, [user?.role, route.params?.userRole]);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Ensure authenticated users stay on dashboard
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Onboarding' as never);
    }

    // Check if we're coming from onboarding with success animation
    if (route.params?.showSuccessAnimation) {
      setShowProfileDrawer(true);
      setShowSuccessAnimation(true);
    }

    // Check for pending buyer listings after authentication
    if (isAuthenticated) {
      const checkPendingListing = async () => {
        await PendingListingService.processPendingListing();
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
    ];
  };

  const navigationItems = getNavigationItems();

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
      return <TransporterDashboardScreen activeTab={activeSection as any} />;
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

  const profileButton = (
    <TouchableOpacity
      onPress={() => setShowProfileDrawer(true)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(74,222,128,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.3)',
      }}
    >
      <User size={18} color="#4ADE80" />
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Glass Header */}
        <GlassHeader showWordmark={true} rightAction={profileButton} />

        {/* Dashboard Content — bottom padding so content clears the floating pill nav */}
        <View style={{ flex: 1, paddingBottom: 90 }}>{renderContent()}</View>
      </View>

      {/* Floating Pill Bottom Navigation */}
      <BottomNavigation
        items={navigationItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => {
          setShowProfileDrawer(false);
          setShowSuccessAnimation(false);
        }}
        showSuccessAnimation={showSuccessAnimation}
      />
    </GradientBackground>
  );
}
