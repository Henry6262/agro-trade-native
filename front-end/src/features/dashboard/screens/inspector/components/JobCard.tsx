import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { GlassCard, GlassButton } from '@design-system';
import { JobCardProps } from '../types';
import { JobPriorityBadge } from './JobPriorityBadge';

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onAccept,
  showAcceptButton = false,
}) => {
  const handlePress = () => {
    onPress?.(job);
  };

  const handleAccept = (e: any) => {
    e.stopPropagation();
    onAccept?.(job.id);
  };

  const formatSpecs = () => {
    const specs = Object.entries(job.productDetails.claimedSpecs)
      .slice(0, 2)
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(' • ');
    return specs;
  };

  return (
    <TouchableOpacity testID="job-card" onPress={handlePress} activeOpacity={0.85}>
      <GlassCard tier="medium" style={styles.card} noPadding>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.productName}>{job.productDetails.name}</Text>
            <Text style={styles.productSub}>
              {job.productDetails.type} • {job.productDetails.quantity} {job.productDetails.unit}
            </Text>
          </View>
          <View testID="priority-badge">
            <JobPriorityBadge priority={job.priority} />
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Body */}
        <View style={styles.body}>
          {/* Location row */}
          <View style={styles.locationRow}>
            <MapPin size={15} color="rgba(255,255,255,0.5)" />
            <View style={styles.locationText}>
              <Text style={styles.locationAddress}>{job.location.address}</Text>
              <Text style={styles.locationCity}>
                {job.location.city}, {job.location.region}
              </Text>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{job.distance} km</Text>
            </View>
          </View>

          {/* Specs */}
          <Text style={styles.specs}>{formatSpecs()}</Text>

          {/* Duration */}
          <View style={styles.durationRow}>
            <Clock size={13} color="rgba(255,255,255,0.35)" />
            <Text style={styles.durationText}>Est. {job.estimatedDuration} min</Text>
          </View>
        </View>

        {/* Accept footer */}
        {showAcceptButton && (
          <>
            <View style={styles.separator} />
            <View style={styles.footer}>
              <GlassButton
                label="Accept Job"
                onPress={handleAccept}
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<ChevronRight size={15} color="#FFFFFF" />}
              />
            </View>
          </>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  distanceBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  durationText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  locationAddress: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  locationCity: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 1,
  },
  locationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 2,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  productSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 1,
  },
  specs: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
});
