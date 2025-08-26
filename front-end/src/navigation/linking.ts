import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'http://localhost:8081/', 'http://localhost:8082/'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Marketplace: 'marketplace',
          Orders: 'orders',
          Profile: 'profile',
        },
      },
      // Flattened onboarding screens
      RoleSelection: 'onboarding/role',
      SellerOnboardingFlow: 'onboarding/seller',
      BuyerOnboardingFlow: 'onboarding/buyer', 
      TransporterOnboardingFlow: 'onboarding/transporter',
      OnboardingComplete: 'onboarding/complete',
      Auth: {
        screens: {
          Welcome: 'auth/welcome',
          Login: 'auth/login',
          Register: 'auth/register',
        },
      },
      // This is the important one - handle OAuth callback
      OAuthCallback: 'auth/callback',
      OrderCreate: 'orders/create',
      OrderDetail: 'orders/:orderId',
      ProductDetail: 'products/:productId',
    },
  },
};