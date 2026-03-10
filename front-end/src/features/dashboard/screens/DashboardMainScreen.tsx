'use client';

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
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
  QrCode,
  Globe,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardStackParamList } from '../../../navigation/types';
import CommandCenterScreen from './admin/CommandCenterScreen';
import AgentNetworkScreen from './admin/AgentNetworkScreen';
import OperationsScreen from './admin/OperationsScreenRefactored';
import IntelligenceScreen from './shared/IntelligenceScreen';
import ImpactScreen from './shared/ImpactScreen';
import TraceabilityScreen from './shared/TraceabilityScreen';
import SellerDashboardSection from '../../../pages/Dashboard/sections/Seller';
import BuyerDashboardSection from '../../../pages/Dashboard/sections/Buyer';
import TransporterDashboardScreen from './transporter/TransporterDashboardScreen';
import type { TransporterDashboardSectionProps } from '../../../pages/Dashboard/sections/Transporter/types';
import { InspectorDashboard } from './inspector/InspectorDashboard';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { BottomNavigation } from '../components/BottomNavigation';
import { CharacterTourOverlay } from '@features/onboarding/components';
import { useAuthStore } from '@stores/auth.store';
import { useTourStore } from '@stores/tour.store';
import { useNotificationStore } from '@stores/notification.store';
import { AdminPricingZonesScreen } from '../../admin/screens/AdminPricingZonesScreen';
import PendingListingService from '@services/pendingListingService';
import { socketService } from '@services/socketService';
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
} from '@services/notificationService';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { OfflineBanner } from '@shared/components/OfflineBanner';
import { GradientBackground, GlassHeader } from '../../../design-system';

type DashboardMainScreenNavigationProp = NativeStackNavigationProp<
  DashboardStackParamList,
  'DashboardMain'
>;
type DashboardMainScreenRouteProp = RouteProp<DashboardStackParamList, 'DashboardMain'>;

interface NavigationItem {
  id: string;
  icon: LucideIcon;
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
  const { hasSeenTour, startTour } = useTourStore();

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
  }, [isAuthenticated, navigation, route.params]);

  // WebSocket: connect on auth, subscribe to live events
  React.useEffect(() => {
    if (!isAuthenticated) return;
    socketService.connect();
    const addNotification = useNotificationStore.getState().addNotification;
    const handleOffer = (payload: { productName?: string; buyerName?: string }) => {
      addNotification({
        type: 'offer',
        title: 'New Offer Received',
        body: `${payload.buyerName ?? 'A buyer'} made an offer on ${payload.productName ?? 'your listing'}`,
      });
    };
    socketService.on('offer:received', handleOffer);
    return () => {
      socketService.off('offer:received', handleOffer);
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Push notifications: register token with backend
  React.useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications()
      .then((token) => {
        if (token) return sendPushTokenToBackend(token);
      })
      .catch(console.warn);
  }, [isAuthenticated]);

  // Start character tour for first-time users
  React.useEffect(() => {
    if (!isAuthenticated || hasSeenTour) return;
    const tourRole =
      userRole === 'buyer'
        ? 'buyer'
        : userRole === 'seller'
          ? 'seller'
          : userRole === 'transporter'
            ? 'transport'
            : null;
    if (!tourRole) return;
    const timer = setTimeout(() => startTour(tourRole), 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasSeenTour, userRole, startTour]);

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
        { id: 'products', icon: Wheat, label: 'PRODUCTS' },
        { id: 'offers', icon: Bell, label: 'OFFERS' },
        { id: 'trades', icon: Package, label: 'TRADES' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET' },
      ];
    }
    if (userRole === 'buyer') {
      return [
        { id: 'orders', icon: ShoppingCart, label: 'ORDERS' },
        { id: 'requests', icon: Package, label: 'REQUESTS' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET' },
      ];
    }
    if (userRole === 'transporter') {
      return [
        { id: 'bidding', icon: Package, label: 'BIDDING' },
        { id: 'offers', icon: Bell, label: 'OFFERS' },
        { id: 'transfers', icon: Truck, label: 'TRANSFERS' },
        { id: 'fleet', icon: Users, label: 'FLEET' },
        { id: 'intelligence', icon: TrendingUp, label: 'MARKET' },
      ];
    }
    if (userRole === 'inspector') {
      return [
        { id: 'active', icon: Package, label: 'ACTIVE' },
        { id: 'available', icon: LayoutGrid, label: 'AVAILABLE' },
      ];
    }
    // Admin navigation (default)
    return [
      { id: 'overview', icon: BarChart3, label: 'ORDERS' },
      { id: 'agents', icon: Users, label: 'NETWORK' },
      { id: 'operations', icon: Package, label: 'TRADE OPS' },
      { id: 'intelligence', icon: TrendingUp, label: 'MARKET' },
      { id: 'impact', icon: Globe, label: 'IMPACT' },
      { id: 'traceability', icon: QrCode, label: 'TRACE' },
    ];
  };

  const navigationItems = getNavigationItems();

  // Render all role-appropriate sections simultaneously, hiding inactive ones.
  // This prevents unmount/remount on tab switch, eliminating redundant data fetches.
  const renderContent = () => {
    if (userRole === 'seller') {
      const sellerContentTabs = ['products', 'offers', 'trades'] as const;
      const isSellerContentTab = sellerContentTabs.includes(
        activeSection as 'products' | 'offers' | 'trades'
      );
      return (
        <ErrorBoundary key={`seller-${activeSection}`}>
          <>
            {/* Seller tabs (products, offers, trades) — kept mounted, hidden when not active */}
            <View style={isSellerContentTab ? styles.sectionVisible : styles.sectionHidden}>
              <SellerDashboardSection
                activeTab={activeSection as 'products' | 'offers' | 'trades'}
              />
            </View>
            {/* Intelligence tab — kept mounted, hidden when not active */}
            <View
              style={
                activeSection === 'intelligence' ? styles.sectionVisible : styles.sectionHidden
              }
            >
              <IntelligenceScreen />
            </View>
          </>
        </ErrorBoundary>
      );
    }
    if (userRole === 'buyer') {
      const buyerContentTabs = ['orders', 'requests'] as const;
      const isBuyerContentTab = buyerContentTabs.includes(activeSection as 'orders' | 'requests');
      return (
        <ErrorBoundary key={`buyer-${activeSection}`}>
          <>
            <View style={isBuyerContentTab ? styles.sectionVisible : styles.sectionHidden}>
              <BuyerDashboardSection activeTab={activeSection as 'orders' | 'requests'} />
            </View>
            <View
              style={
                activeSection === 'intelligence' ? styles.sectionVisible : styles.sectionHidden
              }
            >
              <IntelligenceScreen />
            </View>
          </>
        </ErrorBoundary>
      );
    }
    if (userRole === 'transporter') {
      const transporterContentTabs = ['bidding', 'offers', 'transfers', 'fleet'] as const;
      const isTransporterContentTab = transporterContentTabs.includes(
        activeSection as 'bidding' | 'offers' | 'transfers' | 'fleet'
      );
      return (
        <ErrorBoundary key={`transporter-${activeSection}`}>
          <>
            <View style={isTransporterContentTab ? styles.sectionVisible : styles.sectionHidden}>
              <TransporterDashboardScreen
                activeTab={activeSection as TransporterDashboardSectionProps['activeTab']}
              />
            </View>
            <View
              style={
                activeSection === 'intelligence' ? styles.sectionVisible : styles.sectionHidden
              }
            >
              <IntelligenceScreen />
            </View>
          </>
        </ErrorBoundary>
      );
    }
    if (userRole === 'inspector') {
      // Inspector handles its own tabs internally — single component, no switching needed
      return (
        <ErrorBoundary key="inspector">
          <InspectorDashboard />
        </ErrorBoundary>
      );
    }
    // Admin content — keep all panels mounted
    return (
      <ErrorBoundary key={`admin-${activeSection}`}>
        <>
          <View style={activeSection === 'overview' ? styles.sectionVisible : styles.sectionHidden}>
            <CommandCenterScreen />
          </View>
          <View style={activeSection === 'agents' ? styles.sectionVisible : styles.sectionHidden}>
            <AgentNetworkScreen />
          </View>
          <View
            style={activeSection === 'operations' ? styles.sectionVisible : styles.sectionHidden}
          >
            <OperationsScreen />
          </View>
          <View
            style={activeSection === 'intelligence' ? styles.sectionVisible : styles.sectionHidden}
          >
            <IntelligenceScreen />
          </View>
          <View style={activeSection === 'pricing' ? styles.sectionVisible : styles.sectionHidden}>
            <AdminPricingZonesScreen />
          </View>
          <View style={activeSection === 'impact' ? styles.sectionVisible : styles.sectionHidden}>
            <ImpactScreen />
          </View>
          <View
            style={activeSection === 'traceability' ? styles.sectionVisible : styles.sectionHidden}
          >
            <TraceabilityScreen />
          </View>
        </>
      </ErrorBoundary>
    );
  };

  const profileButton = (
    <TouchableOpacity onPress={() => setShowProfileDrawer(true)} style={styles.profileBtn}>
      <User size={18} color="#4ADE80" />
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <OfflineBanner />
      <View style={styles.root}>
        {/* Glass Header */}
        <GlassHeader showWordmark={true} rightAction={profileButton} />

        {/* Dashboard Content — bottom padding so content clears the floating pill nav */}
        <View style={styles.contentWrapper}>{renderContent()}</View>
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

      {/* Character Tour Overlay — rendered last so it sits above everything */}
      <CharacterTourOverlay />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    paddingBottom: 90,
  },
  profileBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.2)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  root: {
    flex: 1,
  },
  // Section visibility helpers — used to keep all tab panels mounted while
  // hiding inactive ones, preventing remount and redundant data fetches.
  sectionHidden: {
    display: 'none',
    flex: 1,
  },
  sectionVisible: {
    display: 'flex',
    flex: 1,
  },
});
