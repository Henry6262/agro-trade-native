import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Clock, Package } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '@design-system';
import { ActiveJobTabProps } from '../types';
import { VerificationForm } from './VerificationForm';

export const ActiveJobTab: React.FC<ActiveJobTabProps> = ({
  activeJob,
  currentLocation,
  onStartVerification,
  onCompleteVerification,
}) => {
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const inspectorCurrentLocation = currentLocation || {
    latitude: 42.6877,
    longitude: 23.3119,
  };

  if (!activeJob) {
    return (
      <View style={styles.emptyState}>
        <Package size={64} color="rgba(255,255,255,0.25)" />
        <Text style={styles.emptyTitle}>No Active Job</Text>
        <Text style={styles.emptySubtitle}>Accept a job from the Available Jobs tab</Text>
      </View>
    );
  }

  const handleStartVerification = () => {
    setShowVerificationForm(true);
    onStartVerification?.();
  };

  const handleSubmitVerification = (result: any) => {
    setShowVerificationForm(false);
    onCompleteVerification?.(result);
  };

  const formatSpecs = (specs: Record<string, any>) => {
    return Object.entries(specs).map(([key, value]) => (
      <Text key={key} style={styles.specRow}>
        <Text style={styles.specKey}>{key.charAt(0).toUpperCase() + key.slice(1)}: </Text>
        <Text style={styles.specVal}>{value}</Text>
      </Text>
    ));
  };

  const statusVariant = activeJob.status.includes('IN_PROGRESS') ? 'warning' : 'success';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Job Status Header */}
      <GlassCard tier="medium" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{activeJob.productDetails.name}</Text>
            <Text style={styles.headerAddress}>{activeJob.location.address}</Text>
          </View>
          <GlassBadge
            testID="job-status"
            label={activeJob.status.replace('_', ' ')}
            variant={statusVariant}
          />
        </View>
      </GlassCard>

      {/* Map Section */}
      <View testID="job-map" style={styles.mapContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (inspectorCurrentLocation.latitude + activeJob.location.latitude) / 2,
            longitude: (inspectorCurrentLocation.longitude + activeJob.location.longitude) / 2,
            latitudeDelta:
              Math.abs(inspectorCurrentLocation.latitude - activeJob.location.latitude) * 1.5,
            longitudeDelta:
              Math.abs(inspectorCurrentLocation.longitude - activeJob.location.longitude) * 1.5,
          }}
        >
          <Marker coordinate={inspectorCurrentLocation} title="Your Location">
            <View style={styles.markerBlue}>
              <Navigation size={20} color="white" />
            </View>
          </Marker>

          <Marker
            coordinate={{
              latitude: activeJob.location.latitude,
              longitude: activeJob.location.longitude,
            }}
            title="Job Location"
          >
            <View style={styles.markerRed}>
              <MapPin size={20} color="white" />
            </View>
          </Marker>

          <Polyline
            testID="route-line"
            coordinates={[
              inspectorCurrentLocation,
              {
                latitude: activeJob.location.latitude,
                longitude: activeJob.location.longitude,
              },
            ]}
            strokeColor="#4ADE80"
            strokeWidth={3}
          />
        </MapView>

        {/* Distance Overlay */}
        <View style={styles.distanceOverlay}>
          <Text style={styles.distanceText}>{activeJob.distance || 12.3} km remaining</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Product Details */}
        <GlassCard tier="subtle" style={styles.detailCard}>
          <Text style={styles.sectionLabel}>Product Details</Text>
          <Text style={styles.detailMain}>{activeJob.productDetails.type}</Text>
          <Text style={styles.detailSub}>
            Quantity: {activeJob.productDetails.quantity} {activeJob.productDetails.unit}
          </Text>
        </GlassCard>

        {/* Claimed Specifications */}
        <GlassCard tier="subtle" style={styles.detailCard}>
          <Text style={styles.sectionLabel}>Claimed Specifications</Text>
          {formatSpecs(activeJob.productDetails.claimedSpecs)}
        </GlassCard>

        {/* Location */}
        <GlassCard tier="subtle" style={styles.detailCard}>
          <Text style={styles.sectionLabel}>Location</Text>
          <Text style={styles.detailMain}>{activeJob.location.address}</Text>
          <Text style={styles.detailSub}>
            {activeJob.location.city}, {activeJob.location.region}
          </Text>
        </GlassCard>

        {/* Duration */}
        <View style={styles.durationRow}>
          <Clock size={15} color="rgba(255,255,255,0.4)" />
          <Text style={styles.durationText}>
            Estimated duration: {activeJob.estimatedDuration} minutes
          </Text>
        </View>

        {/* Action Button */}
        {activeJob.status === 'ASSIGNED' && (
          <GlassButton
            label="Start Verification"
            onPress={handleStartVerification}
            variant="primary"
            size="lg"
            fullWidth
          />
        )}

        {/* Verification Form */}
        {showVerificationForm && (
          <View testID="verification-form" style={styles.verificationWrap}>
            <VerificationForm
              job={activeJob}
              onSubmit={handleSubmitVerification}
              onCancel={() => setShowVerificationForm(false)}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  detailCard: {
    gap: 4,
  },
  detailMain: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  details: {
    gap: 12,
    padding: 16,
  },
  distanceOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  durationText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  headerAddress: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 2,
  },
  headerCard: {
    margin: 16,
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  mapContainer: {
    borderRadius: 16,
    height: 256,
    margin: 16,
    overflow: 'hidden',
  },
  markerBlue: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 8,
  },
  markerRed: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    padding: 8,
  },
  progressBg: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#4ADE80',
    borderRadius: 2,
    height: '100%',
  },
  progressWrap: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  specKey: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  specRow: {
    fontSize: 13,
    marginBottom: 2,
  },
  specVal: {
    color: 'rgba(255,255,255,0.45)',
  },
  verificationWrap: {
    marginTop: 8,
  },
});
