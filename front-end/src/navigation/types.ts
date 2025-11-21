// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<DashboardStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
  OAuthCallback: undefined;
  OrderCreate: { productId?: string };
  OrderDetail: { orderId: string };
  ProductDetail: { productId: string };
  Profile: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  RoleSelection: undefined;
  BuyerOnboardingFlow: undefined;
  SellerOnboardingFlow: undefined;
  TransporterOnboardingFlow: undefined;
  OnboardingComplete: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminPricingZones: undefined;
  AdminZoneDetails: { zoneId: string };
  AdminProductPrices: undefined;
  BulkPriceUpdate: undefined;
  AdminMapView: undefined;
  TransportOpportunities: undefined;
  TransporterOnboardingFlow: undefined;
  OnboardingComplete: undefined;
};

export type MainTabParamList = {
  Marketplace: undefined;
  Orders: undefined;
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Profile: undefined;
  Search: undefined;
};

export type DashboardStackParamList = {
  DashboardMain: {
    userRole?: 'admin' | 'seller' | 'buyer' | 'transporter';
    showSuccessAnimation?: boolean;
  };
  CommandCenter: undefined;
  AgentNetwork: undefined;
  Operations: undefined;
  Intelligence: undefined;
  SellerDashboard: { activeTab?: string };
  BuyerDashboard: { activeTab?: string };
  TransporterDashboard: { activeTab?: string };
};

export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
  ProductList: { categoryId?: string };
  ProductDetail: { productId: string };
  Search: undefined;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  OrderCreate: { productId?: string };
  OrderTracking: { orderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
