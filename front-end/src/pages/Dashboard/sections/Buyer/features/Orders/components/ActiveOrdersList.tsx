import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { Weight, Clock, CheckCircle2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { Card, CardContent } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { OrderStageIndicator } from '@pages/Dashboard/sections/Buyer/features/Orders/components/OrderStageIndicator';
import type { BuyerOrder } from '../types';

interface ActiveOrdersListProps {
  orders: BuyerOrder[];
  expandedOrderId: string | null;
  onToggle: (orderId: string) => void;
  onConfirmDelivery?: (orderId: string) => void;
  confirmingDeliveryId?: string | null;
}

export const ActiveOrdersList: React.FC<ActiveOrdersListProps> = ({
  orders,
  expandedOrderId,
  onToggle,
  onConfirmDelivery,
  confirmingDeliveryId,
}) => (
  <View className="space-y-4">
    {orders.map((order) => (
      <Card key={order.id} className="bg-neutral-900 border-neutral-800 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold text-lg">Order #{order.operationNumber}</Text>
              <Text className="text-sm text-neutral-400">{order.product}</Text>
            </View>
            <Badge className="bg-blue-500/20 text-blue-300">{order.status}</Badge>
          </View>
          <OrderStageIndicator currentStage={order.currentStage} />
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-neutral-400 text-xs">Quantity</Text>
              <Text className="text-white font-semibold">{order.quantity} tons</Text>
            </View>
            <View className="flex-1">
              <Text className="text-neutral-400 text-xs">Budget</Text>
              <Text className="text-white font-semibold">${order.totalCost.toLocaleString()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-neutral-400 text-xs">Max Price</Text>
              <Text className="text-white font-semibold">${order.maxPricePerTon}/t</Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-3">
            <View className="flex-row items-center">
              <Weight size={14} color="#60A5FA" />
              <Text className="text-neutral-300 text-sm ml-2">
                Secured {Math.round((order.securedQuantity / order.quantity) * 100)}%
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color="#FBBF24" />
              <Text className="text-neutral-300 text-sm ml-2">
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
                  <Text className="text-white font-semibold ml-2">Confirm Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {expandedOrderId === order.id && (
            <View className="mt-3 border-t border-neutral-800 pt-3 space-y-3">
              <View>
                <Text className="text-sm font-medium text-white">Quality Requirements</Text>
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
                  <Text className="text-neutral-400">Created</Text>
                  <Text className="text-white">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400">Budget</Text>
                  <Text className="text-blue-400">${order.totalCost.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    ))}
  </View>
);
