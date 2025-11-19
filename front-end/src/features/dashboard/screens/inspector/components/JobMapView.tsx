import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { JobMapViewProps } from '../types';
import { JobPriorityBadge } from './JobPriorityBadge';
import { JobMarker } from './JobMarker';
import { CurrentLocationMarker } from './CurrentLocationMarker';

export const JobMapView: React.FC<JobMapViewProps> = ({
  jobs,
  currentLocation = { latitude: 42.6977, longitude: 23.3219 },
  onJobSelect,
  onRegionChange,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444'; // red
      case 'MEDIUM':
        return '#eab308'; // yellow
      case 'LOW':
        return '#ffffff'; // white
      default:
        return '#9ca3af'; // gray
    }
  };

  const handleMarkerPress = (job: any) => {
    setSelectedJob(job);
    onJobSelect?.(job);
  };

  const handleRegionChangeComplete = (region: any) => {
    setMapRegion(region);
    onRegionChange?.(region);
  };

  // Calculate zoom level from map region
  const getZoomLevel = () => {
    if (!mapRegion) return 10; // Default zoom level

    // Convert latitudeDelta to approximate zoom level (1-20 scale)
    const zoomLevel = Math.round(Math.log2(360 / mapRegion.latitudeDelta));
    return Math.max(1, Math.min(20, zoomLevel));
  };

  // Calculate clusters for many markers
  const shouldCluster = jobs.length > 20;
  const clusters = shouldCluster ? calculateClusters(jobs) : null;

  function calculateClusters(jobList: any[]) {
    // Simple clustering logic - group nearby jobs
    const clusterRadius = 0.01; // ~1km
    const clustered: any[] = [];
    const processed = new Set();

    jobList.forEach((job, index) => {
      if (processed.has(index)) return;

      const cluster = {
        id: `cluster-${index}`,
        latitude: job.location.latitude,
        longitude: job.location.longitude,
        jobs: [job],
        count: 1,
      };

      jobList.forEach((otherJob, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          const latDiff = Math.abs(job.location.latitude - otherJob.location.latitude);
          const lngDiff = Math.abs(job.location.longitude - otherJob.location.longitude);

          if (latDiff < clusterRadius && lngDiff < clusterRadius) {
            cluster.jobs.push(otherJob);
            cluster.count++;
            processed.add(otherIndex);
          }
        }
      });

      processed.add(index);
      clustered.push(cluster);
    });

    return clustered;
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        testID="map-view"
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Current Location Marker */}
        <Marker
          testID="current-location-marker"
          coordinate={currentLocation}
          title="Your Location"
          anchor={{ x: 0.5, y: 0.5 }} // Center the marker
        >
          <CurrentLocationMarker size="medium" isMoving={true} />
        </Marker>

        {/* Location Accuracy Circle */}
        <Circle
          center={currentLocation}
          radius={30}
          fillColor="rgba(59, 130, 246, 0.2)"
          strokeColor="rgba(59, 130, 246, 0.5)"
          strokeWidth={1}
        />

        {/* Job Markers or Clusters */}
        {(() => {
          console.log('JobMapView rendering:', {
            jobsCount: jobs.length,
            shouldCluster,
            firstJob: jobs[0],
          });

          if (shouldCluster && clusters) {
            return clusters.map((cluster) => (
              <Marker
                key={cluster.id}
                testID="marker-cluster"
                coordinate={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                onPress={() => {
                  // Zoom in on cluster
                  mapRef.current?.animateToRegion(
                    {
                      latitude: cluster.latitude,
                      longitude: cluster.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    },
                    500
                  );
                }}
              >
                <View className="bg-green-600 px-3 py-2 rounded-full">
                  <Text className="text-white font-bold">{cluster.count}</Text>
                </View>
              </Marker>
            ));
          } else {
            const currentZoomLevel = getZoomLevel();
            return jobs.map((job, index) => {
              console.log(
                `Rendering marker ${index}:`,
                job.id,
                job.location,
                `zoom: ${currentZoomLevel}`
              );
              return (
                <Marker
                  key={job.id}
                  testID={`map-marker-${index}`}
                  coordinate={{
                    latitude: job.location.latitude,
                    longitude: job.location.longitude,
                  }}
                  onPress={() => handleMarkerPress(job)}
                  anchor={{ x: 0.5, y: 1 }} // Pin point at bottom center
                >
                  <JobMarker job={job} size="medium" zoomLevel={currentZoomLevel} />

                  <Callout testID="job-callout" onPress={() => onJobSelect?.(job)}>
                    <View className="p-3 min-w-[220px] bg-white rounded-lg">
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className="font-bold text-gray-900 flex-1" numberOfLines={2}>
                          {job.productDetails.name}
                        </Text>
                        <JobPriorityBadge priority={job.priority} size="small" />
                      </View>

                      <Text className="text-gray-600 text-sm mb-1">
                        {job.productDetails.type} • {job.productDetails.quantity}{' '}
                        {job.productDetails.unit}
                      </Text>

                      <Text className="text-gray-500 text-xs mb-2">
                        📍 {job.location.city}, {job.location.region}
                      </Text>

                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-500 text-xs">
                          🕒 {job.estimatedDuration} min • 📏 {job.distance} km
                        </Text>
                        <TouchableOpacity className="bg-green-600 px-3 py-1 rounded">
                          <Text className="text-white text-center text-xs font-medium">
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              );
            });
          }
        })()}
      </MapView>

      {/* Enhanced Map Legend */}
      <View className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200">
        <Text className="text-xs font-bold text-gray-800 mb-2">Job Priority</Text>

        <View className="flex-row items-center mb-1">
          <View className="w-4 h-4 bg-red-500 rounded-full mr-2 shadow-sm" />
          <Text className="text-xs text-gray-700 font-medium">High Priority</Text>
        </View>

        <View className="flex-row items-center mb-1">
          <View className="w-4 h-4 bg-amber-500 rounded-full mr-2 shadow-sm" />
          <Text className="text-xs text-gray-700 font-medium">Medium</Text>
        </View>

        <View className="flex-row items-center">
          <View className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full mr-2 shadow-sm" />
          <Text className="text-xs text-gray-700 font-medium">Low Priority</Text>
        </View>
      </View>
    </View>
  );
};
