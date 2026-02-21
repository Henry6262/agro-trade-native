import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'http://localhost:8081/', 'http://localhost:8082/'],
  config: {
    screens: {
      Main: {
        screens: {
          DashboardMain: 'dashboard',
          CommandCenter: 'command-center',
          AgentNetwork: 'agent-network',
          Operations: 'operations',
          Intelligence: 'intelligence',
          SellerDashboard: 'seller-dashboard',
          BuyerDashboard: 'buyer-dashboard',
          TransporterDashboard: 'transporter-dashboard',
        },
      },
      Onboarding: {
        screens: {
          RoleSelection: 'onboarding/role',
          SellerOnboardingFlow: 'onboarding/seller',
          BuyerOnboardingFlow: 'onboarding/buyer',
          TransporterOnboardingFlow: 'onboarding/transporter',
          OnboardingComplete: 'onboarding/complete',
        },
      },
      Auth: {
        screens: {
          Welcome: 'auth/welcome',
          Login: 'auth/login',
          Register: 'auth/register',
          ForgotPassword: 'auth/forgot-password',
        },
      },
      Admin: {
        screens: {
          AdminDashboard: 'admin',
          AdminPricingZones: 'admin/pricing-zones',
          AdminZoneDetails: 'admin/zones/:zoneId',
          AdminProductPrices: 'admin/product-prices',
          BulkPriceUpdate: 'admin/bulk-update',
          AdminMapView: 'admin/map',
          TransportOpportunities: 'admin/transport-opportunities',
          TransporterOnboardingFlow: 'admin/transporter-onboarding',
          OnboardingComplete: 'admin/onboarding-complete',
        },
      },
      // This is the important one - handle OAuth callback
      OAuthCallback: 'auth/callback',
      OrderCreate: 'orders/create',
      OrderDetail: 'orders/:orderId',
      ProductDetail: 'products/:productId',
      Profile: 'profile',
    },
  },
};
