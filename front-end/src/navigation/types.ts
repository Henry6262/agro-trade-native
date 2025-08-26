// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  OrderCreate: { productId?: string };
  OrderDetail: { orderId: string };
  ProductDetail: { productId: string };
  Profile: undefined;
  OAuthCallback: undefined;
  // Flattened onboarding screens
  RoleSelection: undefined;
  BuyerOnboardingFlow: undefined;
  SellerOnboardingFlow: undefined;
  TransporterOnboardingFlow: undefined;
  OnboardingComplete: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  RoleSelection: undefined;
  SellerProductSelection: undefined;
  SellerProductDetails: { products: string[] };
  SellerMarketInsights: undefined;
  SellerOnboardingFlow: undefined;
  BuyerProductSelection: undefined;
  BuyerRequirements: { products: string[] };
  BuyerMarketOverview: undefined;
  BuyerOnboardingFlow: undefined;
  TransportFleetInfo: undefined;
  TransportJobPreferences: undefined;
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
  DashboardMain: { userRole?: 'admin' | 'seller' | 'buyer' | 'transporter' };
  CommandCenter: undefined;
  AgentNetwork: undefined;
  Operations: undefined;
  Intelligence: undefined;
  SellerDashboard: { activeTab?: string };
  BuyerDashboard: { activeTab?: string };
  TransporterDashboard: { activeTab?: string };
  TransporterBidding: undefined;
  TransporterTransfers: undefined;
  TransporterFleet: undefined;
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