import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Clock, MapPin, Navigation, Package } from 'lucide-react-native';
import type {
  InspectorVerificationJob,
  InspectorVerificationFormValues,
  InspectorLocationCoordinates,
} from '../types';
import { VerificationForm } from './VerificationForm';

interface ActiveJobContentProps {
  job: InspectorVerificationJob | null;
  isLoading: boolean;
  error: string | null;
  currentLocation: InspectorLocationCoordinates | null;
  showVerificationForm: boolean;
  onStartVerification: () => void;
  onCancelVerification: () => void;
  onSubmitVerification: (values: InspectorVerificationFormValues) => void | Promise<void>;
  onExecuteInspection?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

export const ActiveJobContent: React.FC<ActiveJobContentProps> = ({
  job,
  isLoading,
  error,
  currentLocation,
  showVerificationForm,
  onStartVerification,
  onCancelVerification,
  onSubmitVerification,
  onExecuteInspection,
  testID,
  accessibilityLabel,
}) => {
  if (isLoading) {
    return (
      <View style={styles.centeredWrap}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading active job…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredWrap}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSub}>Please pull to refresh.</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centeredWrap}>
        <Package size={64} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyTitle}>No Active Job</Text>
        <Text style={styles.emptySub}>Accept a job from the Available Jobs tab</Text>
      </View>
    );
  }

  const inspectorLocation = currentLocation ?? {
    latitude: job.location.latitude,
    longitude: job.location.longitude,
    address: job.location.address,
  };

  return (
    <ScrollView style={styles.root} testID={testID} accessibilityLabel={accessibilityLabel}>
      {/* Job header banner */}
      <View style={styles.jobHeader}>
        <View style={styles.jobHeaderLeft}>
          <Text style={styles.jobProductName}>{job.productDetails.name}</Text>
          <Text style={styles.jobAddress}>{job.location.address}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{job.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (inspectorLocation.latitude + job.location.latitude) / 2,
            longitude: (inspectorLocation.longitude + job.location.longitude) / 2,
            latitudeDelta:
              Math.abs(inspectorLocation.latitude - job.location.latitude) * 1.5 || 0.2,
            longitudeDelta:
              Math.abs(inspectorLocation.longitude - job.location.longitude) * 1.5 || 0.2,
          }}
        >
          <Marker
            coordinate={{
              latitude: inspectorLocation.latitude,
              longitude: inspectorLocation.longitude,
            }}
            title="Your Location"
          >
            <View style={styles.markerBlue}>
              <Navigation size={20} color="white" />
            </View>
          </Marker>
          <Marker
            coordinate={{ latitude: job.location.latitude, longitude: job.location.longitude }}
            title="Job Location"
          >
            <View style={styles.markerRed}>
              <MapPin size={20} color="white" />
            </View>
          </Marker>
          <Polyline
            coordinates={[
              { latitude: inspectorLocation.latitude, longitude: inspectorLocation.longitude },
              { latitude: job.location.latitude, longitude: job.location.longitude },
            ]}
            strokeColor="#4ADE80"
            strokeWidth={3}
          />
        </MapView>
        <View style={styles.distanceOverlay}>
          <Text style={styles.distanceOverlayText}>{job.distance ?? '–'} km remaining</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        {/* Product Details */}
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Product Details</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxPrimary}>{job.productDetails.type}</Text>
            <Text style={styles.detailBoxSecondary}>
              Quantity: {job.productDetails.quantity} {job.productDetails.unit}
            </Text>
          </View>
        </View>

        {/* Claimed Specifications */}
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Claimed Specifications</Text>
          <View style={styles.detailBox}>
            {Object.entries(job.productDetails.claimedSpecs).map(([key, value]) => (
              <Text key={key} style={styles.specRow}>
                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Location</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxPrimary}>{job.location.address}</Text>
            <Text style={styles.detailBoxSecondary}>
              {job.location.city ?? 'Unknown'}, {job.location.region ?? ''}
            </Text>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.durationRow}>
          <Clock size={16} color="rgba(255,255,255,0.4)" />
          <Text style={styles.durationText}>
            Estimated duration: {job.estimatedDuration ?? 45} minutes
          </Text>
        </View>

        {/* Action buttons */}
        {!showVerificationForm && (
          <View style={styles.actionsWrap}>
            <TouchableOpacity onPress={onStartVerification} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Start Verification</Text>
            </TouchableOpacity>
            {onExecuteInspection && (
              <TouchableOpacity onPress={onExecuteInspection} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Execute Inspection</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showVerificationForm && (
          <View style={styles.formWrap}>
            <VerificationForm
              job={job}
              onSubmit={onSubmitVerification}
              onCancel={onCancelVerification}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionsWrap: {
    gap: 12,
    marginTop: 4,
  },
  centeredWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  detailBlock: {
    marginBottom: 16,
  },
  detailBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  detailBoxPrimary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  detailBoxSecondary: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailsSection: {
    padding: 16,
  },
  distanceOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
  },
  distanceOverlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  durationText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginLeft: 8,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  errorSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  formWrap: {
    marginTop: 16,
  },
  jobAddress: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  jobHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderBottomColor: 'rgba(74,222,128,0.15)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  jobHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobProductName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
  },
  mapContainer: {
    height: 240,
  },
  markerBlue: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    justifyContent: 'center',
    padding: 8,
  },
  markerRed: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 20,
    justifyContent: 'center',
    padding: 8,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  root: {
    flex: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '700',
  },
  specRow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(74,222,128,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
});
