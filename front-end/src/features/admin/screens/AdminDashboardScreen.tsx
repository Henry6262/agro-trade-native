import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../../design-system/GradientBackground';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassButton } from '../../../design-system/GlassButton';
import { StatCard } from '../../../design-system/StatCard';
import { COLORS } from '../../../design-system/tokens';

type AdminNavigationProp = NativeStackNavigationProp<AdminStackParamList>;

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: keyof AdminStackParamList;
  stats?: { label: string; value: string | number }[];
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavigationProp>();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const adminCards: AdminCard[] = [
    {
      id: 'pricing-zones',
      title: 'Pricing Zones',
      description: 'Manage regional pricing zones and city assignments',
      icon: 'map-outline',
      color: '#60A5FA',
      route: 'AdminPricingZones',
      stats: [
        { label: 'Active Zones', value: 9 },
        { label: 'Cities Covered', value: 43 },
      ],
    },
    {
      id: 'product-prices',
      title: 'Product Pricing',
      description: 'Set and update product prices for different zones',
      icon: 'pricetag-outline',
      color: '#4ADE80',
      route: 'AdminProductPrices',
      stats: [
        { label: 'Products', value: 12 },
        { label: 'Price Points', value: 108 },
      ],
    },
    {
      id: 'market-conditions',
      title: 'Market Conditions',
      description: 'Update supply, demand, and market factors',
      icon: 'trending-up-outline',
      color: '#FCD34D',
      route: 'AdminDashboard',
      stats: [
        { label: 'Supply Level', value: '75%' },
        { label: 'Demand Level', value: '82%' },
      ],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View pricing analytics and market insights',
      icon: 'analytics-outline',
      color: '#A78BFA',
      route: 'AdminDashboard',
      stats: [
        { label: 'Avg Price Change', value: '+3.2%' },
        { label: 'Active Listings', value: 247 },
      ],
    },
  ];

  const handleCardPress = (card: AdminCard) => {
    setSelectedCard(card.id);
    setTimeout(() => {
      navigation.navigate(card.route as any);
      setSelectedCard(null);
    }, 150);
  };

  return (
    <GradientBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSub}>Manage pricing zones and market data</Text>
          </View>

          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <StatCard
              label="Active Zones"
              value={9}
              icon={<Ionicons name="map-outline" size={16} color={COLORS.accentGold} />}
              style={{ flex: 1, marginRight: 8 }}
              delay={0}
            />
            <StatCard
              label="Listings"
              value={247}
              icon={<Ionicons name="list-outline" size={16} color={COLORS.accentGold} />}
              style={{ flex: 1 }}
              delay={60}
            />
          </View>

          {/* Admin Cards Grid */}
          <View style={styles.grid}>
            {adminCards.map((card, idx) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card)}
                style={[styles.gridItem, selectedCard === card.id && { opacity: 0.7 }]}
                activeOpacity={0.8}
              >
                <GlassCard tier="medium" animate delay={idx * 60} style={{ flex: 1 }}>
                  {/* Icon */}
                  <View style={[styles.iconWrap, { backgroundColor: `${card.color}20` }]}>
                    <Ionicons name={card.icon} size={24} color={card.color} />
                  </View>

                  {/* Title & Description */}
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {card.description}
                  </Text>

                  {/* Stats */}
                  {card.stats && (
                    <View style={styles.statsSection}>
                      {card.stats.map((stat, i) => (
                        <View key={i} style={styles.statRow}>
                          <Text style={styles.statLabel}>{stat.label}</Text>
                          <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <GlassCard tier="medium" style={styles.quickActions} animate delay={240}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <View style={styles.actionsList}>
              <TouchableOpacity
                onPress={() => navigation.navigate('BulkPriceUpdate')}
                style={styles.actionRow}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="flash-outline" size={18} color="#FCD34D" />
                </View>
                <Text style={styles.actionText}>Bulk Update Prices</Text>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                onPress={() => navigation.navigate('AdminDashboard')}
                style={styles.actionRow}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="download-outline" size={18} color="#4ADE80" />
                </View>
                <Text style={styles.actionText}>Import/Export Data</Text>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                onPress={() => navigation.navigate('AdminMapView')}
                style={styles.actionRow}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="map-outline" size={18} color="#60A5FA" />
                </View>
                <Text style={styles.actionText}>View Zone Map</Text>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  actionDivider: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    height: 1,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  actionText: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsList: {},
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginHorizontal: -6,
  },
  gridItem: {
    padding: 6,
    width: '50%',
  },
  header: {
    marginBottom: 20,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: 12,
    width: 44,
  },
  inner: {
    padding: 16,
    paddingTop: 52,
  },
  quickActions: {},
  quickActionsTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statsSection: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
});
