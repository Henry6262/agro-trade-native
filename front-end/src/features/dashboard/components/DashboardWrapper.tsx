import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Dimensions, ScrollView } from 'react-native';
import { ChevronRight, LogOut, Menu, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileDrawer } from './ProfileDrawer';
import { useAuthStore } from '@stores/auth.store';
import { GradientBackground } from '../../../design-system';

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

  const [activeSection, setActiveSection] = useState(
    defaultSection || navigationItems[0]?.id || 'overview'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(screenWidth < 768);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Ensure authenticated users stay on dashboard
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Onboarding' as never);
    }
  }, [isAuthenticated]);

  const renderSidebar = () => (
    <View
      style={{
        width: sidebarCollapsed ? 64 : 280,
        backgroundColor: 'rgba(5,46,22,0.7)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
        height: '100%',
      }}
    >
      <View style={{ padding: 16, flex: 1 }}>
        {/* Sidebar header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          {!sidebarCollapsed && (
            <View>
              <Text
                style={{
                  color: '#4ADE80',
                  fontWeight: '700',
                  fontSize: 16,
                  letterSpacing: 3,
                }}
              >
                AGRO TRADE
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>
                {userRole.toUpperCase()} PORTAL
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ padding: 8 }}
          >
            <ChevronRight
              color="rgba(255,255,255,0.5)"
              size={20}
              style={{
                transform: [{ rotate: sidebarCollapsed ? '0deg' : '180deg' }],
              }}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ gap: 4 }}>
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isActive ? 'rgba(74,222,128,0.15)' : 'transparent',
                    borderLeftWidth: isActive ? 2 : 0,
                    borderLeftColor: isActive ? '#4ADE80' : 'transparent',
                  }}
                  activeOpacity={0.7}
                >
                  <IconComponent color={isActive ? '#4ADE80' : 'rgba(255,255,255,0.5)'} size={20} />
                  {!sidebarCollapsed && (
                    <Text
                      style={{
                        marginLeft: 12,
                        fontSize: 14,
                        fontWeight: '500',
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      }}
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
        <View
          style={{
            paddingTop: 16,
            marginTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <TouchableOpacity
            onPress={() => setShowProfileDrawer(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderRadius: 8,
            }}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'rgba(74,222,128,0.2)',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(74,222,128,0.3)',
              }}
            >
              <User color="#4ADE80" size={16} />
            </View>
            {!sidebarCollapsed && (
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
                  {user?.name || userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 }}>
                  {user?.email || 'View Profile'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Desktop Sidebar - Always shown on desktop/tablet */}
        {screenWidth >= 768 && <View style={{ position: 'relative' }}>{renderSidebar()}</View>}

        {/* Mobile Sidebar Overlay */}
        {screenWidth < 768 && showMobileSidebar && (
          <>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 40,
              }}
              onPress={() => setShowMobileSidebar(false)}
            />
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 50 }}>
              {renderSidebar()}
            </View>
          </>
        )}

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(5,46,22,0.5)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {screenWidth < 768 && (
              <TouchableOpacity onPress={() => setShowMobileSidebar(true)} style={{ padding: 8 }}>
                <Menu color="#FFFFFF" size={24} />
              </TouchableOpacity>
            )}

            <View style={{ flex: 1, marginHorizontal: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>{title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 }}>
                {subtitle}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setShowProfileDrawer(true)} style={{ padding: 8 }}>
              <User color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => useAuthStore.getState().logout()}
              style={{
                padding: 8,
                marginLeft: 4,
                backgroundColor: 'rgba(239,68,68,0.15)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.3)',
              }}
            >
              <LogOut color="#EF4444" size={18} />
            </TouchableOpacity>
          </View>

          {/* Dynamic Content Based on Active Section */}
          <View style={{ flex: 1 }}>
            {React.Children.map(children, (child) => {
              if (
                React.isValidElement(child) &&
                (child as React.ReactElement<any>).props.id === activeSection
              ) {
                return child;
              }
              return null;
            })}
          </View>
        </View>
      </View>

      {/* Profile Drawer */}
      <ProfileDrawer visible={showProfileDrawer} onClose={() => setShowProfileDrawer(false)} />
    </GradientBackground>
  );
}
