import { useState } from 'react';
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

const QUALITY_GRADES = ['Premium', 'Standard', 'Economy'];
const DELIVERY_FREQUENCIES = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];

export default function BuyerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<Record<string, any>>({});
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
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
    router.push('/buyer/marketplace');
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
      case 2: return selectedProducts.every(id => requirements[id]?.quantity);
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
              What do you need to buy?
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
              Select the products you regularly purchase
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
                    backgroundColor: selectedProducts.includes(product.id) ? '#3b82f6' : '#ffffff',
                    borderWidth: 2,
                    borderColor: selectedProducts.includes(product.id) ? '#3b82f6' : '#e5e7eb',
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
              Purchase Requirements
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
              Tell us about your purchasing needs
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
                        placeholder={`Monthly quantity needed (${product.unit})`}
                        value={requirements[productId]?.quantity || ''}
                        onChangeText={(text) => 
                          setRequirements(prev => ({
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
                      
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {QUALITY_GRADES.map(grade => (
                          <TouchableOpacity
                            key={grade}
                            onPress={() => 
                              setRequirements(prev => ({
                                ...prev,
                                [productId]: { ...prev[productId], quality: grade }
                              }))
                            }
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              backgroundColor: requirements[productId]?.quality === grade ? '#3b82f6' : '#f3f4f6',
                            }}
                          >
                            <Text style={{ 
                              fontSize: 14, 
                              textAlign: 'center',
                              color: requirements[productId]?.quality === grade ? '#ffffff' : '#6b7280' 
                            }}>
                              {grade}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
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
              Help sellers understand your business
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
                placeholder="Business Type (Restaurant, Grocery Store, etc.)"
                value={businessInfo.businessType}
                onChangeText={(text) => 
                  setBusinessInfo(prev => ({ ...prev, businessType: text }))
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
                placeholder="Delivery Location (City, State)"
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

              <View>
                <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                  Preferred Delivery Frequency
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {DELIVERY_FREQUENCIES.map(freq => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => 
                        setBusinessInfo(prev => ({ ...prev, deliveryFrequency: freq }))
                      }
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor: businessInfo.deliveryFrequency === freq ? '#3b82f6' : '#f3f4f6',
                      }}
                    >
                      <Text style={{ 
                        fontSize: 14, 
                        textAlign: 'center',
                        color: businessInfo.deliveryFrequency === freq ? '#ffffff' : '#6b7280' 
                      }}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              Welcome to AgroTrade!
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
              Your buyer profile is ready. Start exploring products from verified sellers.
            </Text>
            
            <View style={{ 
              backgroundColor: '#eff6ff', 
              padding: 20, 
              borderRadius: 12, 
              width: '100%',
              marginTop: 20 
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
                Market Overview
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                • {Math.floor(Math.random() * 50 + 20)} sellers available for {selectedProducts[0] && PRODUCTS.find(p => p.id === selectedProducts[0])?.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                • Average prices are 10% lower than retail
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                • Same-day delivery available in your area
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
        colors={['#eff6ff', '#dbeafe']}
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
                backgroundColor: '#3b82f6',
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
              backgroundColor: canProceed() ? '#3b82f6' : '#e5e7eb',
              opacity: canProceed() ? 1 : 0.5,
            }}
          >
            <Text style={{ color: canProceed() ? '#ffffff' : '#9ca3af', fontSize: 16, fontWeight: '600' }}>
              {currentStep === totalSteps ? 'Start Shopping' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}