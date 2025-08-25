import { Alert } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Test utility for onboarding flow - can be called from dev menu or debug screen
 */
export const testOnboardingFlow = async (): Promise<void> => {
  try {
    console.log('🧪 Starting Onboarding Flow Test...');
    
    const onboardingStore = useOnboardingStore.getState();
    const authStore = useAuthStore.getState();
    
    // Reset stores first
    onboardingStore.resetOnboarding();
    authStore.logout();
    
    // Test 1: Role Selection
    console.log('📝 Test 1: Role Selection');
    onboardingStore.setRole('seller');
    
    if (onboardingStore.selectedRole !== 'seller') {
      throw new Error('Role selection failed');
    }
    console.log('   ✅ Role set to seller');
    
    // Test 2: Data Persistence
    console.log('📝 Test 2: Data Persistence');
    await onboardingStore.saveOnboardingData();
    console.log('   ✅ Data saved to local storage');
    
    // Test 3: Product Selection (Seller Flow)
    console.log('📝 Test 3: Product Selection');
    onboardingStore.addSellerProduct({
      productId: 'test-tomatoes',
      productName: 'Tomatoes',
      category: 'Vegetables', 
      varieties: ['Cherry', 'Roma'],
      quantity: { amount: 100, unit: 'kg' }
    });
    
    if (!onboardingStore.sellerData?.selectedProducts?.length) {
      throw new Error('Product selection failed');
    }
    console.log('   ✅ Product added successfully');
    
    // Test 4: Specifications
    console.log('📝 Test 4: Product Specifications');
    onboardingStore.updateSellerSpecification('test-tomatoes', {
      organicCertified: true,
      harvestDate: new Date().toISOString(),
      qualityGrade: 'A'
    });
    
    if (!onboardingStore.sellerSpecifications['test-tomatoes']) {
      throw new Error('Specification update failed');
    }
    console.log('   ✅ Specifications updated');
    
    // Test 5: Validation
    console.log('📝 Test 5: Data Validation');
    const isStepValid = onboardingStore.isStepValid(1); // Product selection step
    if (!isStepValid) {
      throw new Error('Step validation failed');
    }
    console.log('   ✅ Step validation passed');
    
    // Test 6: Payload Generation
    console.log('📝 Test 6: Payload Generation');
    const payload = onboardingStore.getOnboardingPayload();
    if (!payload || payload.role !== 'seller') {
      throw new Error('Payload generation failed');
    }
    console.log('   ✅ Payload generated correctly');
    
    // Test 7: Progress Calculation
    console.log('📝 Test 7: Progress Calculation');
    const progress = onboardingStore.getProgress();
    if (progress <= 0 || progress > 1) {
      throw new Error('Progress calculation failed');
    }
    console.log(`   ✅ Progress calculated: ${Math.round(progress * 100)}%`);
    
    // Test 8: Error Handling
    console.log('📝 Test 8: Error Handling');
    onboardingStore.setError('Test error message');
    if (!onboardingStore.error) {
      throw new Error('Error setting failed');
    }
    onboardingStore.clearError();
    if (onboardingStore.error) {
      throw new Error('Error clearing failed');
    }
    console.log('   ✅ Error handling works correctly');
    
    // Test 9: Loading States
    console.log('📝 Test 9: Loading States');
    onboardingStore.setLoading(true);
    if (!onboardingStore.isLoading) {
      throw new Error('Loading state setting failed');
    }
    onboardingStore.setLoading(false);
    if (onboardingStore.isLoading) {
      throw new Error('Loading state clearing failed');
    }
    console.log('   ✅ Loading states work correctly');
    
    // Test 10: Storage Verification
    console.log('📝 Test 10: AsyncStorage Integration');
    const storedData = await AsyncStorage.getItem('onboarding-storage');
    if (!storedData) {
      throw new Error('Data not found in AsyncStorage');
    }
    
    const parsedData = JSON.parse(storedData);
    if (!parsedData.state?.selectedRole) {
      throw new Error('Stored data structure incorrect');
    }
    console.log('   ✅ AsyncStorage integration working');
    
    console.log('🎉 All onboarding flow tests passed!');
    
    Alert.alert(
      'Test Results',
      '✅ All onboarding flow tests passed successfully!\n\n' +
      'The integration is working correctly:\n' +
      '• Role selection ✓\n' +
      '• Data persistence ✓\n' +
      '• Product management ✓\n' +
      '• Form validation ✓\n' +
      '• Error handling ✓\n' +
      '• Loading states ✓\n' +
      '• AsyncStorage ✓',
      [{ text: 'Great!', style: 'default' }]
    );
    
  } catch (error) {
    console.error('❌ Onboarding flow test failed:', error);
    
    Alert.alert(
      'Test Failed',
      `❌ Onboarding flow test failed:\n\n${error}`,
      [{ text: 'OK', style: 'destructive' }]
    );
    
    throw error;
  }
};

/**
 * Test authentication flow integration
 */
export const testAuthFlow = async (): Promise<void> => {
  try {
    console.log('🔐 Starting Auth Flow Test...');
    
    const authStore = useAuthStore.getState();
    
    // Test 1: Initial State
    console.log('📝 Test 1: Initial Auth State');
    if (authStore.isAuthenticated) {
      authStore.logout(); // Reset for testing
    }
    
    if (authStore.user || authStore.token || authStore.isAuthenticated) {
      throw new Error('Auth store not properly reset');
    }
    console.log('   ✅ Initial state is correct');
    
    // Test 2: Mock Login
    console.log('📝 Test 2: Mock Login');
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'seller' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    authStore.login(mockUser, 'mock-token', 'mock-refresh-token');
    
    if (!authStore.isAuthenticated || !authStore.user || !authStore.token) {
      throw new Error('Login failed');
    }
    console.log('   ✅ Login successful');
    
    // Test 3: Token Management
    console.log('📝 Test 3: Token Management');
    authStore.setToken('new-mock-token');
    if (authStore.token !== 'new-mock-token') {
      throw new Error('Token update failed');
    }
    console.log('   ✅ Token management works');
    
    // Test 4: Error Handling
    console.log('📝 Test 4: Auth Error Handling');
    authStore.setError('Test auth error');
    if (!authStore.error) {
      throw new Error('Error setting failed');
    }
    authStore.clearError();
    if (authStore.error) {
      throw new Error('Error clearing failed');
    }
    console.log('   ✅ Error handling works');
    
    // Test 5: Logout
    console.log('📝 Test 5: Logout');
    authStore.logout();
    if (authStore.isAuthenticated || authStore.user || authStore.token) {
      throw new Error('Logout failed');
    }
    console.log('   ✅ Logout successful');
    
    console.log('🎉 All auth flow tests passed!');
    
    Alert.alert(
      'Auth Test Results', 
      '✅ All auth flow tests passed successfully!',
      [{ text: 'Great!', style: 'default' }]
    );
    
  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
    
    Alert.alert(
      'Auth Test Failed',
      `❌ Auth flow test failed:\n\n${error}`,
      [{ text: 'OK', style: 'destructive' }]
    );
    
    throw error;
  }
};

/**
 * Comprehensive integration test
 */
export const testCompleteIntegration = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Complete Integration Test...');
    
    // Run individual tests
    await testAuthFlow();
    await testOnboardingFlow();
    
    console.log('🎊 Complete integration test passed!');
    
    Alert.alert(
      'Integration Test Complete',
      '🎊 Complete integration test passed!\n\n' +
      'Your onboarding system is fully integrated and ready for production.',
      [{ text: 'Awesome!', style: 'default' }]
    );
    
  } catch (error) {
    console.error('❌ Complete integration test failed:', error);
    Alert.alert(
      'Integration Test Failed',
      `❌ Complete integration test failed:\n\n${error}`,
      [{ text: 'OK', style: 'destructive' }]
    );
    throw error;
  }
};

/**
 * Clear all onboarding and auth data (for testing)
 */
export const clearAllTestData = async (): Promise<void> => {
  try {
    const onboardingStore = useOnboardingStore.getState();
    const authStore = useAuthStore.getState();
    
    // Clear stores
    onboardingStore.resetOnboarding();
    authStore.logout();
    
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      'onboarding-storage',
      'auth-storage'
    ]);
    
    console.log('🧹 All test data cleared');
    
    Alert.alert(
      'Data Cleared',
      'All onboarding and auth test data has been cleared.',
      [{ text: 'OK', style: 'default' }]
    );
    
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
    Alert.alert(
      'Clear Failed',
      `❌ Failed to clear test data:\n\n${error}`,
      [{ text: 'OK', style: 'destructive' }]
    );
  }
};