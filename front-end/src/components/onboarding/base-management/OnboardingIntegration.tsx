import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BaseManagementFlow, ProductDistributionUI } from './BaseManagementUI';

// Integration points for the onboarding flow

// SELLER ONBOARDING FLOW
export const SellerBaseOnboarding: React.FC = () => {
  // This would be Step 3 in seller onboarding (after product selection)
  
  const steps = [
    {
      title: "1. Business Information",
      status: "completed",
    },
    {
      title: "2. Product Selection",
      status: "completed",
    },
    {
      title: "3. Storage Locations", // NEW STEP
      status: "current",
    },
    {
      title: "4. Stock Distribution", // NEW STEP
      status: "pending",
    },
    {
      title: "5. Pricing & Terms",
      status: "pending",
    },
    {
      title: "6. Verification",
      status: "pending",
    },
  ];

  return (
    <View className="flex-1">
      {/* Progress indicator */}
      <OnboardingProgress steps={steps} />
      
      {/* Main content */}
      <BaseManagementFlow />
    </View>
  );
};

// BUYER ONBOARDING FLOW
export const BuyerBaseOnboarding: React.FC = () => {
  // This would be Step 3 in buyer onboarding (after requirements)
  
  const steps = [
    {
      title: "1. Business Information",
      status: "completed",
    },
    {
      title: "2. Product Requirements",
      status: "completed",
    },
    {
      title: "3. Delivery Locations", // NEW STEP
      status: "current",
    },
    {
      title: "4. Quantity Distribution", // NEW STEP
      status: "pending",
    },
    {
      title: "5. Payment Terms",
      status: "pending",
    },
    {
      title: "6. Verification",
      status: "pending",
    },
  ];

  return (
    <View className="flex-1">
      {/* Progress indicator */}
      <OnboardingProgress steps={steps} />
      
      {/* Main content */}
      <BaseManagementFlow />
    </View>
  );
};

// Progress Component
const OnboardingProgress: React.FC<{ steps: Array<{ title: string; status: string }> }> = ({ steps }) => {
  return (
    <View className="bg-white p-4 border-b border-gray-200">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {steps.map((step, index) => (
          <View key={index} className="flex-row items-center mr-6">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-green-600'
                  : step.status === 'current'
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <Text className="text-white text-xs font-bold">{index + 1}</Text>
            </View>
            <Text
              className={`ml-2 text-sm ${
                step.status === 'current' ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Example of how to use in the existing onboarding flow
export const IntegratedSellerFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [sellerData, setSellerData] = React.useState({
    businessInfo: {},
    products: [],
    bases: [],
    stockDistribution: [],
    pricing: {},
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Existing business info step
        return <View><Text>Business Information Step</Text></View>;
      
      case 2:
        // Existing product selection step
        return <View><Text>Product Selection Step</Text></View>;
      
      case 3:
        // NEW: Base management step
        return (
          <BaseManagementFlow
            onComplete={(bases) => {
              setSellerData({ ...sellerData, bases });
              setCurrentStep(4);
            }}
          />
        );
      
      case 4:
        // NEW: Stock distribution step
        return (
          <ScrollView className="flex-1 bg-gray-50 p-4">
            <Text className="text-2xl font-bold mb-6">Distribute Your Stock</Text>
            {sellerData.products.map((product) => (
              <View key={product.id} className="mb-6">
                <ProductDistributionUI
                  userType="seller"
                  bases={sellerData.bases}
                  product={product}
                />
              </View>
            ))}
          </ScrollView>
        );
      
      case 5:
        // Existing pricing step
        return <View><Text>Pricing & Terms Step</Text></View>;
      
      case 6:
        // Existing verification step
        return <View><Text>Verification Step</Text></View>;
      
      default:
        return null;
    }
  };

  return <View className="flex-1">{renderStep()}</View>;
};

// Smart Distribution Suggestions Component
export const SmartDistributionHelper: React.FC<{
  userType: 'buyer' | 'seller';
  product: any;
  bases: any[];
}> = ({ userType, product, bases }) => {
  const suggestions = [
    {
      title: "Optimize for Transport",
      description: "Distribute based on proximity to major transport routes",
      icon: "🚚",
      distribution: calculateTransportOptimized(bases, product.totalQuantity),
    },
    {
      title: "Capacity Based",
      description: "Distribute proportionally to storage capacity",
      icon: "📦",
      distribution: calculateCapacityBased(bases, product.totalQuantity),
    },
    {
      title: "Equal Distribution",
      description: "Split equally across all locations",
      icon: "⚖️",
      distribution: calculateEqualDistribution(bases, product.totalQuantity),
    },
  ];

  return (
    <View className="bg-blue-50 rounded-xl p-4 mb-6">
      <Text className="text-lg font-semibold text-blue-900 mb-3">
        Smart Distribution Suggestions
      </Text>
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          className="bg-white rounded-lg p-3 mb-2 flex-row items-center"
        >
          <Text className="text-2xl mr-3">{suggestion.icon}</Text>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">{suggestion.title}</Text>
            <Text className="text-sm text-gray-600">{suggestion.description}</Text>
          </View>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">Apply</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Helper functions for smart distribution
const calculateTransportOptimized = (bases: any[], totalQuantity: number) => {
  // Logic to optimize based on transport routes
  // Prioritize ports and locations near highways
  return bases.map(base => ({
    baseId: base.id,
    quantity: totalQuantity / bases.length, // Simplified
  }));
};

const calculateCapacityBased = (bases: any[], totalQuantity: number) => {
  // Distribute based on capacity
  const totalCapacity = bases.reduce((sum, base) => sum + (base.capacity || 0), 0);
  return bases.map(base => ({
    baseId: base.id,
    quantity: Math.floor((base.capacity / totalCapacity) * totalQuantity),
  }));
};

const calculateEqualDistribution = (bases: any[], totalQuantity: number) => {
  const perBase = Math.floor(totalQuantity / bases.length);
  const remainder = totalQuantity % bases.length;
  
  return bases.map((base, index) => ({
    baseId: base.id,
    quantity: perBase + (index === 0 ? remainder : 0),
  }));
};

export default IntegratedSellerFlow;