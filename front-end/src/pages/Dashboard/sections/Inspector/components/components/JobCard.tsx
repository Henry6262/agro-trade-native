import React from 'react';
import { Linking, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { JobCardProps } from '@features/dashboard/screens/inspector/types';
import { JobPriorityBadge } from './JobPriorityBadge';

const openMapNavigation = (latitude: number, longitude: number, label?: string): void => {
  const encodedLabel = encodeURIComponent(label ?? '');
  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${latitude},${longitude}&q=${encodedLabel}`
      : `https://maps.google.com/?daddr=${latitude},${longitude}`;

  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}`).catch((err) =>
      console.warn('Failed to open map navigation', err)
    );
  });
};

export const JobCard = React.memo<JobCardProps>(function JobCard({
  job,
  onPress,
  onAccept,
  showAcceptButton = false,
}) {
  const handlePress = () => {
    onPress?.(job);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAccept = (e: any) => {
    e.stopPropagation();
    onAccept?.(job.id);
  };

  const formatSpecs = () => {
    return Object.entries(job.productDetails.claimedSpecs)
      .slice(0, 2)
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(' • ');
  };

  const specs = formatSpecs();

  return (
    <TouchableOpacity testID="job-card" onPress={handlePress} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.productName}>{job.productDetails.name}</Text>
          <Text style={styles.productType}>
            {job.productDetails.type} • {job.productDetails.quantity} {job.productDetails.unit}
          </Text>
        </View>
        <View testID="priority-badge">
          <JobPriorityBadge priority={job.priority} />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Location — tap to open turn-by-turn navigation */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() =>
            openMapNavigation(
              job.location.latitude,
              job.location.longitude,
              `${job.location.address}, ${job.location.city}`
            )
          }
          accessibilityLabel="Open navigation to job location"
          accessibilityRole="button"
        >
          <MapPin size={16} color="#4ADE80" />
          <View style={styles.locationText}>
            <Text style={styles.address}>{job.location.address}</Text>
            <Text style={styles.cityRegion}>
              {job.location.city}, {job.location.region}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{job.distance} km</Text>
          </View>
        </TouchableOpacity>

        {/* Specifications Preview */}
        {specs ? <Text style={styles.specs}>{specs}</Text> : null}

        {/* Duration */}
        <View style={styles.durationRow}>
          <Clock size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.durationText}>Est. {job.estimatedDuration} min</Text>
        </View>
      </View>

      {/* Footer: Accept button */}
      {showAcceptButton && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleAccept} style={styles.acceptBtn}>
            <Text style={styles.acceptText}>Accept Job</Text>
            <ChevronRight size={16} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  acceptBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  acceptText: {
    color: '#000',
    fontWeight: '700',
    marginRight: 4,
  },
  address: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  body: {
    padding: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cityRegion: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 1,
  },
  distanceBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  durationText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginLeft: 6,
  },
  footer: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  locationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
  },
  productName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  productType: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  specs: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 6,
  },
});
