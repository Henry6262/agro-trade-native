import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { Weight, Clock, CheckCircle2, Users } from 'lucide-react-native';
import { format } from 'date-fns';
import { Card, CardContent } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { PhaseBadge } from '@shared/components';
import { OrderStageIndicator } from '@pages/Dashboard/sections/Buyer/features/Orders/components/OrderStageIndicator';
import EscrowStatusCard from '../../../../../../../features/dashboard/screens/admin/components/EscrowStatusCard';
import type { BuyerOrder, MatchedSeller } from '../types';

const ESCROW_PHASES = new Set(['IN_TRANSIT', 'DELIVERED', 'COMPLETED']);

const SELLER_STATUS_COLORS: Record<string, string> = {
  ACCEPTED: 'text-green-400',
  NEGOTIATING: 'text-yellow-400',
  REJECTED: 'text-red-400',
};

const SellerStatusLabel = React.memo<{ status: string }>(function SellerStatusLabel({ status }) {
  const colorClass = SELLER_STATUS_COLORS[status] ?? 'text-gray-500';
  return <Text className={`text-xs font-medium ${colorClass}`}>{status}</Text>;
});

const MatchedSellersSection = React.memo<{ sellers: MatchedSeller[] }>(
  function MatchedSellersSection({ sellers }) {
    if (sellers.length === 0) return null;

    return (
      <View className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <View className="flex-row items-center space-x-2">
          <Users size={14} color="#60A5FA" />
          <Text className="text-sm font-medium text-gray-900">Matched Sellers</Text>
        </View>
        {sellers.map((seller) => (
          <View key={seller.id} className="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
                {seller.sellerName}
              </Text>
              <SellerStatusLabel status={seller.status} />
            </View>
            <View className="flex-row space-x-4">
              {seller.quantity !== null && (
                <Text className="text-gray-500 text-xs">
                  Qty: <Text className="text-gray-700">{seller.quantity} t</Text>
                </Text>
              )}
              {seller.agreedPricePerUnit !== null && (
                <Text className="text-gray-500 text-xs">
                  Price: <Text className="text-gray-700">${seller.agreedPricePerUnit}/t</Text>
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }
);

interface ActiveOrdersListProps {
  orders: BuyerOrder[];
  expandedOrderId: string | null;
  onToggle: (orderId: string) => void;
  onConfirmDelivery?: (orderId: string) => void;
  confirmingDeliveryId?: string | null;
}

export const ActiveOrdersList = React.memo<ActiveOrdersListProps>(function ActiveOrdersList({
  orders,
  expandedOrderId,
  onToggle,
  onConfirmDelivery,
  confirmingDeliveryId,
}) {
  return (
    <View className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="bg-white border-gray-100 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-900 font-bold text-lg">
                  Order #{order.operationNumber}
                </Text>
                <Text className="text-sm text-gray-500">{order.product}</Text>
              </View>
              <View className="items-end gap-1">
                <PhaseBadge phase={order.phase} />
                <Badge className="bg-blue-500/20 text-blue-300">{order.status}</Badge>
              </View>
            </View>
            <OrderStageIndicator currentStage={order.currentStage} />
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">Quantity</Text>
                <Text className="text-gray-900 font-semibold">{order.quantity} tons</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">Budget</Text>
                <Text className="text-gray-900 font-semibold">
                  ${order.totalCost.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">Max Price</Text>
                <Text className="text-gray-900 font-semibold">${order.maxPricePerTon}/t</Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-3">
              <View className="flex-row items-center">
                <Weight size={14} color="#60A5FA" />
                <Text className="text-gray-600 text-sm ml-2">
                  Secured {Math.round((order.securedQuantity / order.quantity) * 100)}%
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color="#FBBF24" />
                <Text className="text-gray-600 text-sm ml-2">
                  Updated {format(new Date(order.updatedAt), 'MMM dd')}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => onToggle(order.id)} className="mt-3">
              <Text className="text-blue-400 text-sm">
                {expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
              </Text>
            </TouchableOpacity>

            {order.phase === 'DELIVERED' && onConfirmDelivery && (
              <TouchableOpacity
                onPress={() => onConfirmDelivery(order.id)}
                disabled={confirmingDeliveryId === order.id}
                className="mt-3 flex-row items-center justify-center bg-green-600 rounded-xl py-3 px-4"
              >
                {confirmingDeliveryId === order.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#fff" />
                    <Text className="text-gray-900 font-semibold ml-2">Confirm Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {ESCROW_PHASES.has(order.phase) && (
              <EscrowStatusCard tradeOperationId={order.id} isAdmin={false} />
            )}

            {expandedOrderId === order.id && (
              <View className="mt-3 border-t border-gray-100 pt-3 space-y-3">
                <View>
                  <Text className="text-sm font-medium text-gray-900">Quality Requirements</Text>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {order.qualityRequirements.map((req) => (
                      <Badge
                        key={req}
                        variant="outline"
                        className="text-xs border-blue-400 text-blue-300"
                      >
                        {req}
                      </Badge>
                    ))}
                  </View>
                </View>
                <View className="space-y-1 text-sm">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Created</Text>
                    <Text className="text-gray-900">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Budget</Text>
                    <Text className="text-blue-400">${order.totalCost.toLocaleString()}</Text>
                  </View>
                </View>
                <MatchedSellersSection sellers={order.sellers} />
              </View>
            )}
          </CardContent>
        </Card>
      ))}
    </View>
  );
});
