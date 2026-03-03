import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from './tokens';

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(id);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 16 }]}>
      <View style={styles.pill}>
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tab, index === 0 && styles.tabFirst, index === displayItems.length - 1 && styles.tabLast]}
              onPress={() => handlePress(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabInner, isActive && styles.tabActive]}>
                <Icon size={20} color={isActive ? COLORS.accentGreen : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
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
  wrapper: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,20,10,0.88)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 40,
    borderWidth: 1,
    elevation: 24,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    width: '100%',
    // Inner top highlight for depth
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabFirst: {
    borderBottomLeftRadius: 34,
    borderTopLeftRadius: 34,
  },
  tabLast: {
    borderBottomRightRadius: 34,
    borderTopRightRadius: 34,
  },
  tabInner: {
    alignItems: 'center',
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
  },
  tabActive: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderWidth: 1,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.accentGreen,
  },
});
