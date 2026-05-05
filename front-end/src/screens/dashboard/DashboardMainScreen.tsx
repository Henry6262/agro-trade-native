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

import { DashboardStackParamList } from '../../navigation/types';
import CommandCenterScreen from './admin/CommandCenterScreen';
import AgentNetworkScreen from './admin/AgentNetworkScreen';
import OperationsScreen from './admin/OperationsScreen';
import IntelligenceScreen from './shared/IntelligenceScreen';
import ImpactScreen from './shared/ImpactScreen';
import TraceabilityScreen from './shared/TraceabilityScreen';
import SellerDashboardSection from './seller';
import BuyerDashboardSection from './buyer';
import TransporterDashboardSection from './transporter';
import { InspectorDashboardSection } from './inspector';
import UnifiedDashboardScreen from './UnifiedDashboardScreen';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '../../shared/types';
import { GradientBackground, GlassHeader } from '../../design-system';

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

  const userRole = React.useMemo(() => {
    const role = (route.params?.userRole || user?.role || UserRole.FARMER) as string;
    const normalized = role.toUpperCase();
    if (normalized === UserRole.FARMER || normalized === 'SELLER') return 'seller';
    if (normalized === UserRole.BUYER) return 'buyer';
    if (normalized === UserRole.TRANSPORTER || normalized === 'TRANSPORT') return 'transporter';
    if (normalized === UserRole.INSPECTOR) return 'inspector';
    return 'admin';
  }, [user?.role, route.params?.userRole]);

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Onboarding' as never);
    }
  }, [isAuthenticated, navigation]);

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

  const renderContent = () => {
    if (userRole === 'seller' || userRole === 'buyer') {
      return (
        <View style={{ flex: 1 }}>
          <UnifiedDashboardScreen />
        </View>
      );
    }
    if (userRole === 'transporter') {
      return (
        <View style={{ flex: 1 }}>
          <TransporterDashboardSection activeTab={activeSection as any} />
        </View>
      );
    }
    if (userRole === 'inspector') {
      return (
        <View style={{ flex: 1 }}>
          <InspectorDashboardSection activeTab={activeSection as any} />
        </View>
      );
    }
    return (
      <>
        <View style={activeSection === 'overview' ? styles.sectionVisible : styles.sectionHidden}>
          <CommandCenterScreen />
        </View>
        <View style={activeSection === 'agents' ? styles.sectionVisible : styles.sectionHidden}>
          <AgentNetworkScreen />
        </View>
        <View style={activeSection === 'operations' ? styles.sectionVisible : styles.sectionHidden}>
          <OperationsScreen />
        </View>
        <View style={activeSection === 'intelligence' ? styles.sectionVisible : styles.sectionHidden}>
          <IntelligenceScreen />
        </View>
        <View style={activeSection === 'impact' ? styles.sectionVisible : styles.sectionHidden}>
          <ImpactScreen />
        </View>
        <View style={activeSection === 'traceability' ? styles.sectionVisible : styles.sectionHidden}>
          <TraceabilityScreen />
        </View>
      </>
    );
  };

  const profileButton = (
    <TouchableOpacity onPress={() => setShowProfileDrawer(true)} style={styles.profileBtn}>
      <User size={18} color="#4ADE80" />
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={styles.root}>
        <GlassHeader showWordmark={true} rightAction={profileButton} />
        <View style={styles.contentWrapper}>{renderContent()}</View>
      </View>
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
  sectionHidden: {
    display: 'none',
    flex: 1,
  },
  sectionVisible: {
    display: 'flex',
    flex: 1,
  },
});
