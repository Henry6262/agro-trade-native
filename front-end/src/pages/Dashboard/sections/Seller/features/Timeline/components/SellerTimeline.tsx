import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { 
    Package, 
    Handshake, 
    Truck, 
    ShieldCheck, 
    Clock, 
    RefreshCcw,
    ChevronRight 
} from 'lucide-react-native';
import type { SellerTimelineEvent } from '../types';
import { timeAgo } from '@shared/utils';
import { COLORS } from '../../../../../../design-system';

interface SellerTimelineProps {
  events: SellerTimelineEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

const getEventIcon = (type: string, status: string) => {
  switch (type) {
    case 'NEGOTIATION':
      return <Handshake size={16} color="#FCD34D" />;
    case 'TRANSPORT':
      return <Truck size={16} color="#60A5FA" />;
    case 'INSPECTION':
      return <ShieldCheck size={16} color="#4ADE80" />;
    default:
      return <Package size={16} color="#A78BFA" />;
  }
};

const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'ACCEPTED' || s === 'COMPLETED' || s === 'DELIVERED') return '#4ADE80';
    if (s === 'PENDING' || s === 'IN_PROGRESS' || s === 'IN_TRANSIT') return '#FCD34D';
    if (s === 'REJECTED' || s === 'CANCELLED') return '#F87171';
    return '#94A3B8';
};

export const SellerTimeline: React.FC<SellerTimelineProps> = ({ events, isLoading, onRefresh }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Live Trade Activity</Text>
      <TouchableOpacity onPress={onRefresh} disabled={isLoading} style={styles.refreshBtn}>
        <RefreshCcw size={14} color={COLORS.accentGreen} style={{ marginRight: 4 }} />
        <Text style={styles.refreshText}>{isLoading ? '...' : 'REFRESH'}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.timelineCard}>
      {isLoading && events.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accentGreen} />
        </View>
      )}
      
      {!isLoading && events.length === 0 && (
        <View style={styles.emptyContainer}>
            <Clock size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No recent updates found.</Text>
        </View>
      )}

      {events.map((event, index) => (
        <View key={event.id} style={styles.eventRow}>
          {/* Vertical Line */}
          <View style={styles.lineWrapper}>
            <View style={[styles.iconCircle, { borderColor: getStatusColor(event.status) }]}>
              {getEventIcon(event.type, event.status)}
            </View>
            {index < events.length - 1 && <View style={styles.verticalLine} />}
          </View>

          {/* Content */}
          <TouchableOpacity style={styles.eventContent}>
            <View style={styles.eventMain}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.eventTime}>{timeAgo(event.timestamp)}</Text>
              </View>
              <Text style={styles.eventDesc} numberOfLines={2}>
                {event.description}
              </Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(event.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                    {event.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  eventContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 20,
  },
  eventDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  eventHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  eventMain: {
    flex: 1,
    paddingRight: 8,
  },
  eventRow: {
    flexDirection: 'row',
  },
  eventTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1.5,
    height: 32,
    justifyContent: 'center',
    width: 32,
    zIndex: 2,
  },
  lineWrapper: {
    alignItems: 'center',
    marginRight: 12,
    width: 32,
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  refreshBtn: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  refreshText: {
    color: COLORS.accentGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start'
  },
  statusDot: {
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  verticalLine: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    position: 'absolute',
    top: 32,
    width: 2,
  },
});
