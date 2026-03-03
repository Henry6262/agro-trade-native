import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Filter, MapPin, Search, ShoppingCart, Truck, Users, Wheat, X } from 'lucide-react-native';
import { GlassBadge, GlassButton, GlassCard, GlassInput } from '../../../../design-system';
import { COLORS } from '../../../../design-system';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 };

export default function AgentNetworkScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTypeFilter] = useState('all');

  const users = [
    {
      id: 'F-1042',
      name: 'Green Valley Farms',
      type: 'farmer',
      location: 'Iowa, USA',
      lastActive: '2 min ago',
      trades: 47,
      rating: 4.8,
      products: ['Corn', 'Soybeans'],
    },
    {
      id: 'B-2018',
      name: 'Fresh Market Co',
      type: 'buyer',
      location: 'Chicago, IL',
      lastActive: '15 min ago',
      trades: 32,
      rating: 4.5,
      products: ['Vegetables', 'Grains'],
    },
    {
      id: 'F-1056',
      name: 'Sunrise Orchards',
      type: 'farmer',
      location: 'California, USA',
      lastActive: '1 min ago',
      trades: 63,
      rating: 4.9,
      products: ['Apples', 'Citrus', 'Avocados'],
    },
    {
      id: 'T-3007',
      name: 'Swift Transport LLC',
      type: 'transporter',
      location: 'Texas, USA',
      lastActive: '3 hours ago',
      trades: 28,
      rating: 4.2,
      products: ['Refrigerated', 'Bulk Grain'],
    },
    {
      id: 'B-2031',
      name: 'Global Food Distributors',
      type: 'buyer',
      location: 'New York, NY',
      lastActive: '5 min ago',
      trades: 41,
      rating: 4.6,
      products: ['Organic', 'Non-GMO'],
    },
    {
      id: 'F-1089',
      name: 'Prairie Wheat Co',
      type: 'farmer',
      location: 'Kansas, USA',
      lastActive: '1 day ago',
      trades: 12,
      rating: 4.3,
      products: ['Wheat', 'Barley', 'Sorghum'],
    },
    {
      id: 'B-2044',
      name: 'Restaurant Supply Chain',
      type: 'buyer',
      location: 'Los Angeles, CA',
      lastActive: '8 min ago',
      trades: 55,
      rating: 4.7,
      products: ['Fresh Produce', 'Dairy'],
    },
    {
      id: 'T-3015',
      name: 'AgriLogistics Pro',
      type: 'transporter',
      location: 'Florida, USA',
      lastActive: '22 min ago',
      trades: 38,
      rating: 4.4,
      products: ['Temperature Controlled', 'Express'],
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  const getUserTypeIcon = (type: string, size = 16) => {
    switch (type) {
      case 'farmer':
        return <Wheat width={size} height={size} color={COLORS.textSecondary} />;
      case 'buyer':
        return <ShoppingCart width={size} height={size} color={COLORS.textSecondary} />;
      case 'transporter':
        return <Truck width={size} height={size} color={COLORS.textSecondary} />;
      default:
        return <Users width={size} height={size} color={COLORS.textMuted} />;
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header actions */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>NETWORK</Text>
            <Text style={styles.subtitle}>Manage farmers, buyers, and transporters</Text>
          </View>
          <View style={styles.headerButtons}>
            <GlassButton label="Add User" onPress={() => {}} variant="primary" size="sm" />
            <GlassButton
              label="Filter"
              onPress={() => {}}
              variant="secondary"
              size="sm"
              leftIcon={<Filter size={14} color={COLORS.textPrimary} />}
            />
          </View>
        </View>

        {/* Compact stats strip */}
        <GlassCard tier="subtle" style={styles.statsStrip} animate={false}>
          <View style={styles.statsInner}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, styles.statValueGreen]}>247</Text>
              <Text style={styles.statLabel}>FARMERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>183</Text>
              <Text style={styles.statLabel}>BUYERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>TRANSPORT</Text>
            </View>
          </View>
        </GlassCard>

        {/* Search */}
        <GlassInput
          placeholder="Search by name, type, or location..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          leftIcon={<Search size={16} color={COLORS.textMuted} />}
        />

        {/* User list */}
        <GlassCard tier="medium" delay={160} noPadding>
          <View style={styles.dirHeader}>
            <Text style={styles.dirTitle}>NETWORK DIRECTORY</Text>
          </View>
          {/* Column headers */}
          <View style={styles.tableHeader}>
            <View style={styles.colType}>
              <Text style={styles.colLabel}>TYPE</Text>
            </View>
            <View style={styles.colName}>
              <Text style={styles.colLabel}>NAME</Text>
            </View>
            <View style={styles.colLoc}>
              <Text style={styles.colLabel}>LOCATION</Text>
            </View>
            <View style={styles.colNum}>
              <Text style={styles.colLabel}>TRADES</Text>
            </View>
            <View style={styles.colNum}>
              <Text style={styles.colLabel}>RATING</Text>
            </View>
          </View>
          {filteredUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => setSelectedUser(user)}
              style={styles.userRow}
              activeOpacity={0.7}
            >
              <View style={styles.colType}>{getUserTypeIcon(user.type)}</View>
              <View style={styles.colName}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userId}>{user.id}</Text>
              </View>
              <View style={styles.colLoc}>
                <View style={styles.locationRow}>
                  <MapPin size={10} color={COLORS.textMuted} />
                  <Text style={styles.locationText}>{user.location}</Text>
                </View>
              </View>
              <View style={styles.colNum}>
                <Text style={styles.goldNum}>{user.trades}</Text>
              </View>
              <View style={styles.colNum}>
                <Text style={styles.goldNum}>{user.rating}</Text>
                <Text style={styles.star}> ★</Text>
              </View>
            </TouchableOpacity>
          ))}
        </GlassCard>
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard tier="strong" style={styles.modalCard} animate={false}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>{selectedUser?.name}</Text>
                <Text style={styles.modalId}>{selectedUser?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={DIVIDER} />

            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>TYPE</Text>
                  <View style={styles.fieldRow}>
                    {selectedUser && getUserTypeIcon(selectedUser.type, 14)}
                    <Text style={styles.fieldValue}> {selectedUser?.type?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>LOCATION</Text>
                  <Text style={styles.fieldValue}>{selectedUser?.location}</Text>
                </View>
              </View>
              <View style={styles.modalRow}>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>COMPLETED TRADES</Text>
                  <Text style={styles.goldValue}>{selectedUser?.trades}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>RATING</Text>
                  <Text style={styles.goldValue}>{selectedUser?.rating} ★</Text>
                </View>
              </View>
              <View style={styles.tagsSection}>
                <Text style={styles.fieldLabel}>PRODUCTS / SERVICES</Text>
                <View style={styles.tagsRow}>
                  {selectedUser?.products.map((product: string, idx: number) => (
                    <GlassBadge key={idx} label={product} variant="muted" size="sm" />
                  ))}
                </View>
              </View>
            </View>

            <View style={DIVIDER} />

            <View style={styles.modalActions}>
              <GlassButton
                label="Create Order"
                onPress={() => setSelectedUser(null)}
                variant="primary"
                size="sm"
                style={styles.modalBtn}
              />
              <GlassButton
                label="View History"
                onPress={() => {}}
                variant="secondary"
                size="sm"
                style={styles.modalBtn}
              />
              <GlassButton
                label="Send Message"
                onPress={() => {}}
                variant="ghost"
                size="sm"
                style={styles.modalBtn}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  closeBtn: { padding: 4 },
  colLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  colLoc: { flex: 2, paddingHorizontal: 6 },
  colName: { flex: 2, paddingHorizontal: 6 },
  colNum: { alignItems: 'center', flexDirection: 'row', width: 56 },
  colType: { justifyContent: 'center', width: 40 },
  dirHeader: { paddingBottom: 10, paddingHorizontal: 16, paddingTop: 14 },
  dirTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldRow: { alignItems: 'center', flexDirection: 'row' },
  fieldValue: { color: COLORS.textPrimary, fontSize: 13 },
  goldNum: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  goldValue: {
    color: COLORS.accentGold,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
  },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerLeft: { flex: 1, marginRight: 12 },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  locationText: { color: COLORS.textSecondary, fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modalBody: { gap: 12, marginVertical: 12 },
  modalBtn: { flex: 1 },
  modalCard: { maxWidth: 480, width: '100%' },
  modalField: { flex: 1 },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalId: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  modalName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalRow: { flexDirection: 'row', gap: 16 },
  root: { backgroundColor: 'transparent', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { gap: 16, padding: 16, paddingBottom: 100 },
  star: { color: COLORS.accentGold, fontSize: 11 },
  statCell: { alignItems: 'center', flex: 1, paddingVertical: 10 },
  statDivider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 32,
    width: 1,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '800',
  },
  statValueGreen: { color: COLORS.accentGreen },
  statsInner: { alignItems: 'center', flexDirection: 'row' },
  statsStrip: { paddingVertical: 0 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  tableHeader: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagsSection: { gap: 6 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  userId: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 1 },
  userName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  userRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
