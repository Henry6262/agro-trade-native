import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, GLASS } from './tokens';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
}

interface GlassBottomNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const GlassBottomNav: React.FC<GlassBottomNavProps> = ({ items, activeId, onSelect }) => {
  const insets = useSafeAreaInsets();
  const displayItems = items.slice(0, 5);

  const handlePress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelect(id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || 8,
          backgroundColor: 'rgba(5,46,22,0.92)',
          borderTopWidth: 1,
          borderTopColor: GLASS.subtle.border,
        },
      ]}
    >
      <View style={styles.row}>
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.tab}
              onPress={() => handlePress(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabInner, isActive && styles.tabActive]}>
                <Icon size={22} color={isActive ? COLORS.accentGreen : 'rgba(255,255,255,0.35)'} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabActive: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabInner: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.accentGreen,
  },
});
