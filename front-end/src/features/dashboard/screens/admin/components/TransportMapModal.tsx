import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  X,
  Truck,
  MapPin,
  Package,
  DollarSign,
  Clock,
  Route,
  CheckCircle,
} from 'lucide-react-native';
import { TransportMapView } from './TransportMapView';
import type { TradeOperation, TransportEstimate } from '@services/tradeOperationService';
import { COLORS } from '../../../../../design-system';

const { height: screenHeight } = Dimensions.get('window');

interface TransportMapModalProps {
  visible: boolean;
  onClose: () => void;
  tradeOperation: TradeOperation | null;
  transportEstimate: TransportEstimate | null;
  onConfirmRoute?: () => void;
}

export const TransportMapModal: React.FC<TransportMapModalProps> = ({
  visible,
  onClose,
  tradeOperation,
  transportEstimate,
  onConfirmRoute,
}) => {
  if (!tradeOperation || !transportEstimate) {
    return null;
  }

  // Prepare route data for map
  const prepareRouteData = () => {
    // Mock coordinates - in production these would come from real addresses
    const warehouseCoords = {
      latitude: 42.0,
      longitude: -93.0,
      address: 'Central Warehouse, Iowa',
    };

    const buyerCoords = {
      latitude: tradeOperation.buyListing.deliveryAddress?.latitude || 41.8781,
      longitude: tradeOperation.buyListing.deliveryAddress?.longitude || -87.6298,
      address: tradeOperation.buyListing.deliveryAddress?.address || 'Chicago, IL',
    };

    const pickupLocations =
      tradeOperation.selectedSellers?.map((seller, index) => ({
        sellerId: seller.sellerId,
        sellerName: seller.saleListing.seller.name,
        latitude: 42.0 + index * 0.15, // Mock coordinates
        longitude: -93.0 + index * 0.15,
        address: seller.saleListing.address?.address || `Farm ${index + 1}`,
        quantity: seller.requestedQuantity,
        product: seller.saleListing.product.name,
      })) || [];

    return {
      origin: warehouseCoords,
      pickupLocations,
      destination: buyerCoords,
      totalDistance: transportEstimate.distance,
      estimatedDuration: transportEstimate.duration,
      estimatedCost: transportEstimate.costs.totalCost,
    };
  };

  const route = prepareRouteData();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Truck size={24} color={COLORS.info} />
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerTitle}>Transport Route Planning</Text>
                <Text style={styles.headerSub}>{tradeOperation.operationNumber}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View */}
        <View style={{ height: screenHeight * 0.5 }}>
          <TransportMapView route={route} height={screenHeight * 0.5} showDetails={true} />
        </View>

        {/* Transport Details */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsContent}>
            {/* Summary Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Route Summary</Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Route size={18} color={COLORS.textMuted} />
                  <Text style={styles.labelText}>Total Distance</Text>
                </View>
                <Text style={styles.valueText}>{transportEstimate.distance} km</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Clock size={18} color={COLORS.textMuted} />
                  <Text style={styles.labelText}>Estimated Time</Text>
                </View>
                <Text style={styles.valueText}>
                  {Math.round(transportEstimate.duration / 60)} hours
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Package size={18} color={COLORS.textMuted} />
                  <Text style={styles.labelText}>Pickup Stops</Text>
                </View>
                <Text style={styles.valueText}>{route.pickupLocations.length} locations</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <DollarSign size={18} color={COLORS.accentGreen} />
                  <Text style={styles.valueBold}>Transport Cost</Text>
                </View>
                <Text style={styles.costValue}>
                  ${transportEstimate.costs.totalCost.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cost Breakdown</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.labelText}>Base Rate</Text>
                <Text style={styles.valueText}>
                  ${transportEstimate.breakdown.baseRate?.toFixed(2) || '0.00'}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.labelText}>Distance Charge</Text>
                <Text style={styles.valueText}>
                  ${transportEstimate.breakdown.distanceCharge?.toFixed(2) || '0.00'}
                </Text>
              </View>

              {(transportEstimate.breakdown.multiPickupSurcharge ?? 0) > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.labelText}>Multi-Pickup Surcharge</Text>
                  <Text style={styles.valueText}>
                    ${transportEstimate.breakdown.multiPickupSurcharge?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              )}

              <View style={styles.breakdownRow}>
                <Text style={styles.labelText}>Cost per km</Text>
                <Text style={styles.mutedText}>
                  ${transportEstimate.breakdown.costPerKm.toFixed(2)}/km
                </Text>
              </View>
            </View>

            {/* Vehicle Info */}
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleRow}>
                <Truck size={20} color={COLORS.info} />
                <Text style={styles.vehicleTitle}>
                  Vehicle Type: {transportEstimate.vehicleType}
                </Text>
              </View>
              <Text style={styles.vehicleSub}>
                Capacity: {tradeOperation.buyListing.quantity} {tradeOperation.buyListing.unit}
              </Text>
            </View>

            {/* Pickup Schedule */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pickup Schedule</Text>

              {route.pickupLocations.map((pickup, index) => (
                <View key={pickup.sellerId} style={styles.pickupRow}>
                  <View style={styles.pickupBadge}>
                    <Text style={styles.pickupBadgeText}>{index + 1}</Text>
                  </View>
                  <View style={styles.pickupInfo}>
                    <Text style={styles.pickupName}>{pickup.sellerName}</Text>
                    <Text style={styles.pickupAddress}>{pickup.address}</Text>
                    <View style={styles.pickupProductRow}>
                      <Package size={14} color={COLORS.textMuted} />
                      <Text style={styles.pickupProduct}>
                        {pickup.product} - {pickup.quantity} units
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Delivery */}
              <View style={styles.deliveryRow}>
                <View style={styles.deliveryBadge}>
                  <MapPin size={14} color="white" />
                </View>
                <View style={styles.pickupInfo}>
                  <Text style={styles.pickupName}>Final Delivery</Text>
                  <Text style={styles.pickupAddress}>{route.destination.address}</Text>
                  <Text style={styles.deliveryBuyerText}>
                    Buyer: {tradeOperation.buyListing.buyer.name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {onConfirmRoute && (
              <TouchableOpacity onPress={onConfirmRoute} style={styles.confirmBtn}>
                <CheckCircle size={20} color="white" />
                <Text style={styles.confirmBtnText}>Confirm Transport Route</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 8,
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.20)',
    borderColor: 'rgba(74,222,128,0.40)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
    padding: 16,
  },
  confirmBtnText: {
    color: COLORS.accentGreen,
    fontSize: 15,
    fontWeight: '700',
  },
  costValue: {
    color: COLORS.accentGreen,
    fontSize: 17,
    fontWeight: '700',
  },
  deliveryBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.20)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginTop: 2,
    width: 32,
  },
  deliveryBuyerText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    marginTop: 4,
  },
  deliveryRow: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  detailsContent: {
    padding: 16,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
    marginVertical: 10,
  },
  header: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerSub: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 2,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  labelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  mutedText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  pickupAddress: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pickupBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.20)',
    borderColor: 'rgba(251,146,60,0.35)',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginTop: 2,
    width: 32,
  },
  pickupBadgeText: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '700',
  },
  pickupInfo: {
    flex: 1,
  },
  pickupName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickupProduct: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  pickupProductRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  pickupRow: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingBottom: 10,
  },
  root: {
    backgroundColor: '#021207',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueBold: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleCard: {
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderColor: 'rgba(96,165,250,0.20)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  vehicleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  vehicleSub: {
    color: COLORS.info,
    fontSize: 13,
    marginTop: 4,
  },
  vehicleTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransportMapModal;
