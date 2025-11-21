import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import {
  MapPin,
  Weight,
  TrendingUp,
  Edit,
  Package,
  Eye,
  Shield,
  ShieldCheck,
  DollarSign,
} from 'lucide-react-native';

import { Card } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import type {
  OfferSummary,
  ProductMetadata,
  SellerProduct,
} from '@pages/Dashboard/sections/Seller/features/Products/types';
import {
  formatLocation,
  formatTimeAgo,
  getPriceRange,
  getProductImage,
} from '@pages/Dashboard/sections/Seller/features/Products/utils';

interface SellerProductCardProps {
  product: SellerProduct;
  metadata: ProductMetadata[];
  offerSummary: OfferSummary;
  onEdit: (product: SellerProduct) => void;
  onViewOffers: (product: SellerProduct, offers: OfferSummary['offers']) => void;
}

export const SellerProductCard: React.FC<SellerProductCardProps> = ({
  product,
  metadata,
  offerSummary,
  onEdit,
  onViewOffers,
}) => {
  const productImage = getProductImage(product, metadata);
  const locationStr = formatLocation(product.location);
  const timeAgo = formatTimeAgo(product.updatedAt);
  const { min: priceRangeMin, max: priceRangeMax } = getPriceRange(product, metadata);

  return (
    <View className="mb-4">
      <Card className="bg-neutral-900 border-neutral-700 overflow-hidden">
        <View className="flex-row">
          <View className="w-32 h-32 bg-neutral-800 relative">
            <Image source={{ uri: productImage }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute top-2 right-2">
              {product.isVerified ? (
                <View className="bg-green-500/90 rounded-full p-1">
                  <ShieldCheck color="#ffffff" size={14} />
                </View>
              ) : (
                <View className="bg-neutral-600/90 rounded-full p-1">
                  <Shield color="#ffffff" size={14} />
                </View>
              )}
            </View>
            {offerSummary.urgent > 0 && (
              <View className="absolute top-2 left-2">
                <View className="bg-red-500/90 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-bold">{offerSummary.urgent}</Text>
                </View>
              </View>
            )}
          </View>

          <View className="flex-1 p-4">
            <View className="mb-2">
              <Text className="text-white font-bold text-lg">{product.name}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <MapPin color="#9ca3af" size={12} />
                <Text className="text-neutral-400 text-sm">{locationStr}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1">
                <Weight color="#60a5fa" size={16} />
                <Text className="text-white font-medium">
                  {product.quantity} {product.unit || 'tons'}
                </Text>
              </View>
              <View className="bg-neutral-800 rounded-lg px-2 py-1 flex-row items-center">
                <TrendingUp color="#10b981" size={12} />
                <Text className="text-xs text-green-400 ml-1">
                  {priceRangeMin && priceRangeMax
                    ? `€${priceRangeMin}-${priceRangeMax}`
                    : 'Price TBD'}
                </Text>
              </View>
            </View>

            {product.qualityTags?.length ? (
              <View className="flex-row flex-wrap gap-1 mb-2">
                {product.qualityTags.slice(0, 4).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-green-400 text-green-300"
                  >
                    {tag}
                  </Badge>
                ))}
                {product.qualityTags.length > 4 && (
                  <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                    +{product.qualityTags.length - 4}
                  </Badge>
                )}
              </View>
            ) : null}

            <View className="flex-row justify-between items-center">
              <View className="flex-row gap-3">
                <Text className="text-xs text-neutral-400">👁 {product.views || 0}</Text>
                <Text className="text-xs text-neutral-400">💬 {product.inquiries || 0}</Text>
                <Text className="text-xs text-neutral-500">{timeAgo}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onEdit(product)}
                className="bg-neutral-800 rounded-full p-2"
              >
                <Edit color="#9ca3af" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-4 pb-4">
          {offerSummary.total > 0 ? (
            <TouchableOpacity
              onPress={() => onViewOffers(product, offerSummary.offers)}
              className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30"
              style={{
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Package color="#10B981" size={18} />
                    <Text className="text-green-400 font-semibold ml-2">
                      {offerSummary.total} Buyer Offer{offerSummary.total > 1 ? 's' : ''}
                    </Text>
                    {offerSummary.urgent > 0 && (
                      <View className="bg-red-500/30 rounded-full px-2 py-1 ml-2">
                        <Text className="text-red-400 text-xs font-medium">
                          {offerSummary.urgent} urgent
                        </Text>
                      </View>
                    )}
                  </View>
                  {offerSummary.bestOffer && (
                    <View className="flex-row items-center">
                      <DollarSign color="#FBBF24" size={16} />
                      <Text className="text-white font-bold ml-2">
                        Best: €{offerSummary.bestOffer}/kg
                      </Text>
                      {priceRangeMax && offerSummary.bestOffer > priceRangeMax && (
                        <View className="bg-green-500/20 px-2 py-1 rounded ml-2">
                          <Text className="text-green-400 text-xs font-medium">
                            +€{(offerSummary.bestOffer - priceRangeMax).toFixed(1)} premium
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View className="ml-4">
                  <View className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center border border-green-500/40">
                    <Eye color="#10B981" size={20} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold">No Offers Yet</Text>
                <Text className="text-neutral-400 text-xs mt-1">
                  Promote this product to reach more buyers
                </Text>
              </View>
              <TouchableOpacity className="bg-neutral-700 rounded-full px-3 py-1">
                <Text className="text-white text-xs">Boost</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
};
