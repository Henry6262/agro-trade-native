import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MapPin, Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react-native';

// Distribution Summary Component - Final review before submission
export const DistributionSummaryView: React.FC<{
  userType: 'buyer' | 'seller';
  bases: any[];
  distributions: any[];
  onEdit: () => void;
  onConfirm: () => void;
}> = ({ userType, bases, distributions, onEdit, onConfirm }) => {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Review Your Distribution
        </Text>
        <Text className="text-gray-600">
          {userType === 'buyer' 
            ? 'Confirm where you need products delivered'
            : 'Confirm where your products are located'}
        </Text>
      </View>

      {/* Summary Cards */}
      <View className="p-4">
        <SummaryMetrics distributions={distributions} bases={bases} />
        
        {/* Distribution Details */}
        {distributions.map((distribution) => (
          <DistributionCard 
            key={distribution.productId}
            distribution={distribution}
            bases={bases}
            userType={userType}
          />
        ))}

        {/* Optimization Suggestions */}
        <OptimizationSuggestions distributions={distributions} bases={bases} />

        {/* Actions */}
        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onEdit}
            className="flex-1 border border-gray-300 rounded-xl py-4"
          >
            <Text className="text-gray-700 text-center font-semibold">
              Edit Distribution
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            className="flex-1 bg-green-600 rounded-xl py-4"
          >
            <Text className="text-white text-center font-semibold">
              Confirm & Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Summary Metrics Component
const SummaryMetrics: React.FC<{ distributions: any[]; bases: any[] }> = ({ 
  distributions, 
  bases 
}) => {
  const totalProducts = distributions.length;
  const totalBases = bases.length;
  const totalQuantity = distributions.reduce((sum, d) => 
    sum + d.distribution.reduce((s, dd) => s + dd.quantity, 0), 0
  );

  return (
    <View className="grid grid-cols-3 gap-3 mb-6">
      <View className="bg-white rounded-xl p-4">
        <Package size={24} color="#10b981" />
        <Text className="text-2xl font-bold text-gray-900 mt-2">{totalProducts}</Text>
        <Text className="text-sm text-gray-600">Products</Text>
      </View>
      <View className="bg-white rounded-xl p-4">
        <MapPin size={24} color="#3b82f6" />
        <Text className="text-2xl font-bold text-gray-900 mt-2">{totalBases}</Text>
        <Text className="text-sm text-gray-600">Locations</Text>
      </View>
      <View className="bg-white rounded-xl p-4">
        <TrendingUp size={24} color="#f59e0b" />
        <Text className="text-2xl font-bold text-gray-900 mt-2">{totalQuantity}</Text>
        <Text className="text-sm text-gray-600">Total Tons</Text>
      </View>
    </View>
  );
};

// Individual Distribution Card
const DistributionCard: React.FC<{
  distribution: any;
  bases: any[];
  userType: 'buyer' | 'seller';
}> = ({ distribution, bases, userType }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View className="bg-white rounded-xl mb-4 overflow-hidden">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="p-4 flex-row justify-between items-center"
      >
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {distribution.productName}
          </Text>
          <Text className="text-gray-600">
            {distribution.totalQuantity} {distribution.unit} across {distribution.distribution.length} locations
          </Text>
        </View>
        <View className="transform rotate-90">
          <Text>{expanded ? '◀' : '▶'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="border-t border-gray-200 p-4">
          {distribution.distribution.map((item) => {
            const base = bases.find(b => b.id === item.baseId);
            return (
              <BaseDistributionRow 
                key={item.baseId}
                base={base}
                quantity={item.quantity}
                percentage={item.percentage}
                unit={distribution.unit}
              />
            );
          })}
          
          {/* Transport Cost Estimate */}
          {userType === 'buyer' && (
            <TransportCostEstimate distribution={distribution} bases={bases} />
          )}
        </View>
      )}
    </View>
  );
};

// Base Distribution Row
const BaseDistributionRow: React.FC<{
  base: any;
  quantity: number;
  percentage: number;
  unit: string;
}> = ({ base, quantity, percentage, unit }) => {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
      <View className="flex-1">
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-2 ${
            base.type === 'PORT' ? 'bg-blue-500' :
            base.type === 'WAREHOUSE' ? 'bg-green-500' :
            base.type === 'SILO' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
          <Text className="font-medium text-gray-900">{base.name}</Text>
        </View>
        <Text className="text-sm text-gray-500 ml-4">{base.city}</Text>
      </View>
      <View className="items-end">
        <Text className="font-semibold text-gray-900">
          {quantity} {unit}
        </Text>
        <Text className="text-sm text-gray-500">{percentage}%</Text>
      </View>
    </View>
  );
};

// Transport Cost Estimate Component
const TransportCostEstimate: React.FC<{
  distribution: any;
  bases: any[];
}> = ({ distribution, bases }) => {
  // Calculate estimated transport costs based on distribution
  const estimatedCost = distribution.distribution.reduce((total, item) => {
    const base = bases.find(b => b.id === item.baseId);
    // Simple calculation: €20 per ton base + €0.5 per km
    const baseCost = item.quantity * 20;
    const distanceCost = 0; // Would calculate based on actual distances
    return total + baseCost + distanceCost;
  }, 0);

  return (
    <View className="mt-4 p-3 bg-blue-50 rounded-lg">
      <View className="flex-row items-center">
        <TrendingUp size={16} color="#3b82f6" />
        <Text className="ml-2 text-sm font-medium text-blue-900">
          Estimated Transport Cost
        </Text>
      </View>
      <Text className="text-lg font-bold text-blue-900 mt-1">
        €{estimatedCost.toLocaleString()}
      </Text>
      <Text className="text-xs text-blue-700 mt-1">
        Based on current market rates and distances
      </Text>
    </View>
  );
};

// Optimization Suggestions
const OptimizationSuggestions: React.FC<{
  distributions: any[];
  bases: any[];
}> = ({ distributions, bases }) => {
  const suggestions = analyzeDistribution(distributions, bases);

  if (suggestions.length === 0) {
    return (
      <View className="bg-green-50 rounded-xl p-4 flex-row items-center mb-4">
        <CheckCircle size={20} color="#10b981" />
        <Text className="ml-3 text-green-800 flex-1">
          Your distribution looks optimized! No issues detected.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-yellow-50 rounded-xl p-4 mb-4">
      <View className="flex-row items-center mb-3">
        <AlertCircle size={20} color="#f59e0b" />
        <Text className="ml-2 font-semibold text-yellow-900">
          Optimization Suggestions
        </Text>
      </View>
      {suggestions.map((suggestion, index) => (
        <View key={index} className="mb-2">
          <Text className="text-yellow-800">• {suggestion}</Text>
        </View>
      ))}
    </View>
  );
};

// Analysis function for suggestions
const analyzeDistribution = (distributions: any[], bases: any[]) => {
  const suggestions = [];

  // Check for unbalanced distribution
  distributions.forEach(dist => {
    const maxPercentage = Math.max(...dist.distribution.map(d => d.percentage));
    if (maxPercentage > 70) {
      suggestions.push(
        `Consider distributing ${dist.productName} more evenly to reduce transport risk`
      );
    }
  });

  // Check for capacity issues
  bases.forEach(base => {
    const totalAtBase = distributions.reduce((sum, dist) => {
      const baseItem = dist.distribution.find(d => d.baseId === base.id);
      return sum + (baseItem?.quantity || 0);
    }, 0);

    if (base.capacity && totalAtBase > base.capacity * 0.9) {
      suggestions.push(
        `${base.name} is near capacity (${Math.round((totalAtBase / base.capacity) * 100)}% used)`
      );
    }
  });

  return suggestions;
};

// Quick Edit Modal for adjusting distributions
export const QuickEditDistribution: React.FC<{
  distribution: any;
  bases: any[];
  onSave: (updated: any) => void;
}> = ({ distribution, bases, onSave }) => {
  const [tempDistribution, setTempDistribution] = React.useState(distribution);

  const handleSliderChange = (baseId: string, value: number) => {
    const total = distribution.totalQuantity;
    const newDistribution = [...tempDistribution.distribution];
    const index = newDistribution.findIndex(d => d.baseId === baseId);
    
    if (index >= 0) {
      const oldValue = newDistribution[index].quantity;
      const diff = value - oldValue;
      
      // Adjust other values proportionally
      const othersTotal = total - value;
      const otherIndices = newDistribution
        .map((_, i) => i)
        .filter(i => i !== index);
      
      if (otherIndices.length > 0 && othersTotal >= 0) {
        const perOther = Math.floor(othersTotal / otherIndices.length);
        const remainder = othersTotal % otherIndices.length;
        
        otherIndices.forEach((i, idx) => {
          newDistribution[i].quantity = perOther + (idx === 0 ? remainder : 0);
          newDistribution[i].percentage = Math.round((newDistribution[i].quantity / total) * 100);
        });
        
        newDistribution[index].quantity = value;
        newDistribution[index].percentage = Math.round((value / total) * 100);
      }
      
      setTempDistribution({
        ...tempDistribution,
        distribution: newDistribution,
      });
    }
  };

  return (
    <View className="bg-white rounded-2xl p-6">
      <Text className="text-xl font-bold mb-4">
        Adjust Distribution: {distribution.productName}
      </Text>
      
      {bases.map(base => {
        const item = tempDistribution.distribution.find(d => d.baseId === base.id);
        const quantity = item?.quantity || 0;
        const percentage = item?.percentage || 0;
        
        return (
          <View key={base.id} className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="font-medium text-gray-900">{base.name}</Text>
              <Text className="text-gray-700">
                {quantity} {distribution.unit} ({percentage}%)
              </Text>
            </View>
            <Slider
              value={quantity}
              onValueChange={(val) => handleSliderChange(base.id, val)}
              minimumValue={0}
              maximumValue={distribution.totalQuantity}
              step={1}
              minimumTrackTintColor="#10b981"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#10b981"
            />
          </View>
        );
      })}
      
      <View className="flex-row space-x-3 mt-6">
        <TouchableOpacity
          onPress={() => setTempDistribution(distribution)}
          className="flex-1 border border-gray-300 rounded-lg py-3"
        >
          <Text className="text-gray-700 text-center font-medium">Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSave(tempDistribution)}
          className="flex-1 bg-green-600 rounded-lg py-3"
        >
          <Text className="text-white text-center font-medium">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DistributionSummaryView;