import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { SearchBar } from '../../components/onboarding/SearchBar';
import { ProductSelectionCard, CategoryChip } from '../../components/onboarding/ProductSelectionCard';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useOnboardingStore } from '../../store/onboardingStore';
import {
  MOCK_PRODUCTS,
  PRODUCT_CATEGORIES,
} from '../../constants/mockData';
import type { UserRole } from '../../types';

interface ProductSelectionScreenProps {
  role: UserRole;
  onContinue: (selectedProducts: string[]) => void;
  title?: string;
  subtitle?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const ProductSelectionScreen: React.FC<ProductSelectionScreenProps> = ({
  role,
  onContinue,
  title,
  subtitle,
}) => {
  const { selectedRole, sellerData, buyerData } = useOnboardingStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Entry animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    
    const timer1 = setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 800 });
    }, 200);

    const timer2 = setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 600 });
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [headerOpacity, contentOpacity, buttonOpacity]);

  React.useEffect(() => {
    buttonOpacity.value = withSpring(selectedProducts.length > 0 ? 1 : 0.5, {
      damping: 15,
      stiffness: 150,
    });
  }, [selectedProducts.length, buttonOpacity]);

  // Filter products based on search and categories
  const filteredProducts = useMemo(() => {
    let filtered = MOCK_PRODUCTS;

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategories]);

  // Get filter options with counts
  const filterOptions = useMemo(() => {
    return PRODUCT_CATEGORIES.map(category => ({
      id: category.slug,
      label: category.name,
      icon: category.icon,
      count: MOCK_PRODUCTS.filter(p => p.category === category.slug).length,
    }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedProducts.length > 0) {
      onContinue(selectedProducts);
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (role) {
      case 'seller':
        return 'What do you sell?';
      case 'buyer':
        return 'What do you buy?';
      default:
        return 'Select Products';
    }
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    switch (role) {
      case 'seller':
        return 'Select all the products you grow or have available to sell';
      case 'buyer':
        return 'Select all the products you typically purchase for your business';
      default:
        return 'Choose the products relevant to your business';
    }
  };

  const renderProductItem = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: layoutMode === 'grid' ? screenWidth / 2 - 16 : screenWidth - 24 }}>
      <ProductSelectionCard
        product={item}
        isSelected={selectedProducts.includes(item.id)}
        onPress={() => handleProductSelect(item.id)}
        delay={index * 50}
        variant={layoutMode === 'grid' ? 'default' : 'detailed'}
        showPrice={role === 'buyer'}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <OnboardingProgress />
        </View>

        {/* Title Section */}
        <Animated.View style={headerStyle} className="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            {getSubtitle()}
          </Text>

          {selectedProducts.length > 0 && (
            <View className="mt-4 bg-green-50 px-4 py-3 rounded-xl">
              <Text className="text-green-700 font-medium">
                {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Search and Filters */}
        <Animated.View style={contentStyle} className="px-6 mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            filters={filterOptions}
            selectedFilters={selectedCategories}
            onFilterChange={handleCategoryFilter}
            placeholder="Search products..."
          />
        </Animated.View>

        {/* Layout Toggle */}
        <View className="flex-row justify-end px-6 mb-4">
          <View className="flex-row bg-white rounded-lg p-1 shadow-sm">
            <Button
              title="Grid"
              onPress={() => setLayoutMode('grid')}
              variant={layoutMode === 'grid' ? 'primary' : 'ghost'}
              size="small"
              className="mr-1"
            />
            <Button
              title="List"
              onPress={() => setLayoutMode('list')}
              variant={layoutMode === 'list' ? 'primary' : 'ghost'}
              size="small"
            />
          </View>
        </View>

        {/* Products List */}
        <Animated.View style={contentStyle} className="flex-1 px-3">
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={layoutMode === 'grid' ? 2 : 1}
              key={layoutMode} // Force re-render when layout changes
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
              columnWrapperStyle={layoutMode === 'grid' ? { justifyContent: 'space-around' } : undefined}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <EmptyState
                title="No products found"
                description="Try adjusting your search or filter criteria"
                icon="🔍"
              />
            </View>
          )}
        </Animated.View>

        {/* Continue Button */}
        <View className="px-6 pb-6">
          <Animated.View style={buttonStyle}>
            <Button
              title={`Continue with ${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'}`}
              onPress={handleContinue}
              disabled={selectedProducts.length === 0}
              variant="primary"
              size="large"
              className="w-full"
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Specialized screens for each role
export const SellerProductSelectionScreen: React.FC = () => {
  const { nextStep, addSellerProduct } = useOnboardingStore();
  
  const handleContinue = (selectedProducts: string[]) => {
    // Convert selected product IDs to ProductSelection objects
    selectedProducts.forEach(productId => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      if (product) {
        addSellerProduct({
          productId: product.id,
          productName: product.name,
          category: product.category,
          varieties: product.varieties || [],
          quantity: { amount: 0, unit: 'tons' },
        });
      }
    });
    
    nextStep();
    // Navigate to product details screen
  };

  return (
    <ProductSelectionScreen
      role="seller"
      onContinue={handleContinue}
      title="What do you grow?"
      subtitle="Select all the products you currently grow or plan to sell through our platform"
    />
  );
};

export const BuyerProductSelectionScreen: React.FC = () => {
  const { nextStep, addBuyerRequirement } = useOnboardingStore();
  
  const handleContinue = (selectedProducts: string[]) => {
    // Convert selected product IDs to ProductRequirement objects
    selectedProducts.forEach(productId => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      if (product) {
        addBuyerRequirement({
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantity: { amount: 0, unit: 'tons' },
        });
      }
    });
    
    nextStep();
    // Navigate to requirements screen
  };

  return (
    <ProductSelectionScreen
      role="buyer"
      onContinue={handleContinue}
      title="What do you purchase?"
      subtitle="Select all the agricultural products you typically buy for your business operations"
    />
  );
};