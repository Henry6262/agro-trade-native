import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  ChevronRight,
  Menu,
  User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileDrawer } from './ProfileDrawer';
import { useAuthStore } from '../../../stores/auth.store';
import { Container } from '../../../shared/components';

export interface NavigationItem {
  id: string;
  icon: any;
  label: string;
  component?: React.ComponentType<any>;
}

interface DashboardWrapperProps {
  userRole: 'admin' | 'seller' | 'buyer' | 'transporter';
  navigationItems: NavigationItem[];
  children?: React.ReactNode;
  defaultSection?: string;
  title?: string;
  subtitle?: string;
}

export default function DashboardWrapper({
  userRole,
  navigationItems,
  children,
  defaultSection,
  title = 'Dashboard',
  subtitle = 'Manage your operations',
}: DashboardWrapperProps) {
  const navigation = useNavigation();
  const { width: screenWidth } = Dimensions.get('window');
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeSection, setActiveSection] = useState(defaultSection || navigationItems[0]?.id || 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(screenWidth < 768);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Ensure authenticated users stay on dashboard
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('RoleSelection' as never);
    }
  }, [isAuthenticated]);

  const getRoleBrandColor = () => {
    switch (userRole) {
      case 'seller':
        return 'text-blue-500 border-blue-500';
      case 'buyer':
        return 'text-yellow-500 border-yellow-500';
      case 'transporter':
        return 'text-green-500 border-green-500';
      case 'admin':
      default:
        return 'text-green-500 border-green-500';
    }
  };

  const brandColor = getRoleBrandColor();

  const renderSidebar = () => (
    <View
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-70'
      } bg-neutral-900 border-r border-neutral-700 h-full`}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-8">
          <View className={`${sidebarCollapsed ? 'hidden' : 'flex'}`}>
            <Text className={`font-bold text-lg tracking-wider ${brandColor.split(' ')[0]}`}>
              AGRI TRADE
            </Text>
            <Text className="text-neutral-500 text-xs">{userRole.toUpperCase()} PORTAL</Text>
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

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveSection(item.id);
                    if (screenWidth < 768) {
                      setShowMobileSidebar(false);
                    }
                  }}
                  className={`flex-row items-center p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-neutral-800 border-l-2 ' + brandColor
                      : 'hover:bg-neutral-800/50'
                  }`}
                >
                  <IconComponent
                    color={isActive ? '#10b981' : '#9CA3AF'}
                    size={20}
                  />
                  {!sidebarCollapsed && (
                    <Text
                      className={`ml-3 text-sm font-medium ${
                        isActive ? 'text-white' : 'text-neutral-400'
                      }`}
                    >
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* User Profile Section */}
        <View className="pt-4 mt-4 border-t border-neutral-700">
          <TouchableOpacity
            onPress={() => setShowProfileDrawer(true)}
            className="flex-row items-center p-2 rounded hover:bg-neutral-800/50"
          >
            <View className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
              <User color="#9CA3AF" size={16} />
            </View>
            {!sidebarCollapsed && (
              <View className="ml-3">
                <Text className="text-white text-sm font-medium">
                  {user?.name || userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Text>
                <Text className="text-neutral-500 text-xs">{user?.email || 'View Profile'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Container safeArea={true} noPadding={true} backgroundColor="#000000">
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      <View className="flex-1 flex-row">
        {/* Desktop Sidebar - Always shown on desktop/tablet */}
        {screenWidth >= 768 && (
          <View style={{ position: 'relative' }}>
            {renderSidebar()}
          </View>
        )}

        {/* Mobile Sidebar Overlay */}
        {screenWidth < 768 && showMobileSidebar && (
          <>
            <TouchableOpacity
              className="absolute inset-0 bg-black/50 z-40"
              onPress={() => setShowMobileSidebar(false)}
            />
            <View className="absolute left-0 top-0 bottom-0 z-50">
              {renderSidebar()}
            </View>
          </>
        )}

        {/* Main Content Area */}
        <View className="flex-1">
          {/* Mobile Header */}
          {screenWidth < 768 && (
            <View className="px-4 py-3 border-b border-neutral-800 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setShowMobileSidebar(true)}
                className="p-2"
              >
                <Menu color="#9CA3AF" size={24} />
              </TouchableOpacity>
              <View className="flex-1 mx-4">
                <Text className="text-white font-bold text-lg">{title}</Text>
                <Text className="text-neutral-400 text-xs">{subtitle}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileDrawer(true)}
                className="p-2"
              >
                <User color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
          )}

          {/* Dynamic Content Based on Active Section */}
          <View className="flex-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.props.id === activeSection) {
                return child;
              }
              return null;
            })}
          </View>
        </View>
      </View>

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />
    </Container>
  );
}