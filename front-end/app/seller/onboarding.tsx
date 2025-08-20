import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Mock product data for selection
const PRODUCTS = [
  { id: 'wheat', name: 'Wheat', icon: '🌾', unit: 'tons' },
  { id: 'rice', name: 'Rice', icon: '🌾', unit: 'tons' },
  { id: 'corn', name: 'Corn', icon: '🌽', unit: 'tons' },
  { id: 'tomatoes', name: 'Tomatoes', icon: '🍅', unit: 'kg' },
  { id: 'potatoes', name: 'Potatoes', icon: '🥔', unit: 'kg' },
  { id: 'onions', name: 'Onions', icon: '🧅', unit: 'kg' },
  { id: 'apples', name: 'Apples', icon: '🍎', unit: 'kg' },
  { id: 'oranges', name: 'Oranges', icon: '🍊', unit: 'kg' },
];

export default function SellerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    location: '',
    phone: '',
  });

  const totalSteps = 4;

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Navigate to main app or complete screen
    router.push('/seller/dashboard');
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedProducts.length > 0;
      case 2: return selectedProducts.every(id => productDetails[id]?.quantity);
      case 3: return businessInfo.businessName && businessInfo.location;
      case 4: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              What do you sell?
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
              Select all the products you grow or sell
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {PRODUCTS.map(product => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => toggleProduct(product.id)}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: selectedProducts.includes(product.id) ? '#10b981' : '#ffffff',
                    borderWidth: 2,
                    borderColor: selectedProducts.includes(product.id) ? '#10b981' : '#e5e7eb',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{product.icon}</Text>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500',
                    color: selectedProducts.includes(product.id) ? '#ffffff' : '#374151' 
                  }}>
                    {product.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              Product Details
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
              Tell us about your production capacity
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProducts.map(productId => {
                const product = PRODUCTS.find(p => p.id === productId);
                if (!product) return null;
                
                return (
                  <View key={productId} style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 20 }}>{product.icon}</Text>
                      <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 8 }}>
                        {product.name}
                      </Text>
                    </View>
                    
                    <View style={{ gap: 12 }}>
                      <TextInput
                        placeholder={`Monthly capacity (${product.unit})`}
                        value={productDetails[productId]?.quantity || ''}
                        onChangeText={(text) => 
                          setProductDetails(prev => ({
                            ...prev,
                            [productId]: { ...prev[productId], quantity: text }
                          }))
                        }
                        keyboardType="numeric"
                        style={{
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 8,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          fontSize: 16,
                        }}
                      />
                      
                      <TextInput
                        placeholder="Price per unit (optional)"
                        value={productDetails[productId]?.price || ''}
                        onChangeText={(text) => 
                          setProductDetails(prev => ({
                            ...prev,
                            [productId]: { ...prev[productId], price: text }
                          }))
                        }
                        keyboardType="numeric"
                        style={{
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 8,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          fontSize: 16,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              Business Information
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
              Help buyers find and trust you
            </Text>
            
            <View style={{ gap: 16 }}>
              <TextInput
                placeholder="Business Name"
                value={businessInfo.businessName}
                onChangeText={(text) => 
                  setBusinessInfo(prev => ({ ...prev, businessName: text }))
                }
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                }}
              />
              
              <TextInput
                placeholder="Location (City, State)"
                value={businessInfo.location}
                onChangeText={(text) => 
                  setBusinessInfo(prev => ({ ...prev, location: text }))
                }
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                }}
              />
              
              <TextInput
                placeholder="Phone Number"
                value={businessInfo.phone}
                onChangeText={(text) => 
                  setBusinessInfo(prev => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                }}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              You're All Set!
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
              Your seller profile is ready. You can now start receiving orders from buyers.
            </Text>
            
            <View style={{ 
              backgroundColor: '#f0fdf4', 
              padding: 20, 
              borderRadius: 12, 
              width: '100%',
              marginTop: 20 
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
                Market Insights
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                • High demand for {selectedProducts[0] && PRODUCTS.find(p => p.id === selectedProducts[0])?.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                • Average selling price is 15% higher than last month
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                • 247 active buyers in your area
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7']}
        style={{ flex: 1 }}
      >
        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>
              Step {currentStep} of {totalSteps}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius: 4,
                width: `${(currentStep / totalSteps) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          padding: 24,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff'
        }}>
          <TouchableOpacity
            onPress={currentStep === 1 ? () => router.back() : handlePreviousStep}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>
              {currentStep === 1 ? 'Back' : 'Previous'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={currentStep === totalSteps ? handleComplete : handleNextStep}
            disabled={!canProceed()}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
              backgroundColor: canProceed() ? '#10b981' : '#e5e7eb',
              opacity: canProceed() ? 1 : 0.5,
            }}
          >
            <Text style={{ color: canProceed() ? '#ffffff' : '#9ca3af', fontSize: 16, fontWeight: '600' }}>
              {currentStep === totalSteps ? 'Complete' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}