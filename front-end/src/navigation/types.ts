// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
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
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
};

export type OnboardingStackParamList = {
  RoleSelection: undefined;
  SellerProductSelection: undefined;
  SellerProductDetails: { products: string[] };
  SellerMarketInsights: undefined;
  BuyerProductSelection: undefined;
  BuyerRequirements: { products: string[] };
  BuyerMarketOverview: undefined;
  TransportFleetInfo: undefined;
  TransportJobPreferences: undefined;
  TransportOpportunities: undefined;
  AccountCreation: undefined;
  OnboardingComplete: undefined;
};

export type MainTabParamList = {
  Marketplace: undefined;
  Orders: undefined;
  Profile: undefined;
  Search: undefined;
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