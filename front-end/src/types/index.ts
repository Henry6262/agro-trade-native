// Base types for the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: Location;
  onboardingComplete?: boolean;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'buyer' | 'seller' | 'transport' | 'admin';

export interface UserPreferences {
  products?: string[];
  categories?: string[];
  location?: Location;
  radius?: number;
  notifications?: NotificationPreferences;
}

export interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  quantity: number;
  images: string[];
  sellerId: string;
  seller: User;
  location: Location;
  quality: ProductQuality;
  harvestDate?: string;
  expiryDate?: string;
  certifications: string[];
  isOrganic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ProductQuality {
  grade: 'A' | 'B' | 'C';
  description: string;
  certifiedBy?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyer: User;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  deliveryAddress: Location;
  estimatedDelivery?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'mobile_money'
  | 'cash_on_delivery';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
  success: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

// Onboarding types
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  selectedRole?: UserRole;
  sellerData?: SellerOnboardingData;
  buyerData?: BuyerOnboardingData;
  transportData?: TransportOnboardingData;
  isComplete: boolean;
}

export interface SellerOnboardingData {
  selectedProducts: ProductSelection[];
  marketInsights?: MarketInsights;
  businessInfo?: SellerBusinessInfo;
}

export interface BuyerOnboardingData {
  requiredProducts: ProductRequirement[];
  deliveryPreferences?: DeliveryPreferences;
  purchasingPower?: PurchasingPower;
}

export interface TransportOnboardingData {
  fleetInfo: FleetInformation;
  serviceArea: ServiceArea;
  jobPreferences: JobPreferences;
  opportunities?: TransportOpportunities;
}

export interface ProductSelection {
  productId: string;
  productName: string;
  category: string;
  varieties: string[];
  quantity: ProductQuantity;
  priceRange?: PriceRange;
  qualitySpecs?: string[];
}

export interface ProductRequirement {
  productId: string;
  productName: string;
  category: string;
  quantity: ProductQuantity;
  maxPrice?: number;
  qualityRequirements?: string[];
  deliveryDeadline?: string;
}

export interface ProductQuantity {
  amount: number;
  unit: 'kg' | 'tons' | 'bags' | 'boxes' | 'liters';
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface FleetInformation {
  vehicleCount: number;
  vehicleTypes: VehicleType[];
  baseLocation: Location;
  capacity: VehicleCapacity;
}

export interface VehicleType {
  id: string;
  name: string;
  capacity: number;
  suitable_for: string[];
}

export interface VehicleCapacity {
  total: number;
  unit: 'tons' | 'cubic_meters';
}

export interface ServiceArea {
  radius: number;
  preferredRegions: string[];
  coverage: 'local' | 'regional' | 'national' | 'international';
}

export interface JobPreferences {
  cargoTypes: string[];
  maxDistance: number;
  minDistance: number;
  availability: WeeklyAvailability;
  preferredRoutes?: string[];
}

export interface WeeklyAvailability {
  [key: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface MarketInsights {
  activeBuyers: number;
  currentDemand: DemandData[];
  trendingProducts: string[];
  averagePrices: PriceData[];
}

export interface DemandData {
  productId: string;
  productName: string;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  buyersCount: number;
  totalQuantityDemanded: number;
}

export interface PriceData {
  productId: string;
  productName: string;
  averagePrice: number;
  priceChange: number;
  currency: string;
}

export interface DeliveryPreferences {
  preferredTimeSlots: TimeSlot[];
  deliveryAddress: Location;
  specialInstructions?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PurchasingPower {
  monthlyBudget?: number;
  currency: string;
  paymentMethods: PaymentMethod[];
  creditLimit?: number;
}

export interface TransportOpportunities {
  availableJobs: number;
  potentialEarnings: number;
  popularRoutes: RouteInfo[];
  demandHotspots: Location[];
}

export interface RouteInfo {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedEarnings: number;
  frequency: number;
}

export interface OnboardingCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundImage: string;
  color: string;
  gradient: string[];
}

export interface SellerBusinessInfo {
  businessName?: string;
  businessType: 'individual' | 'company' | 'cooperative';
  yearsInBusiness?: number;
  farmSize?: number;
  farmSizeUnit?: 'hectares' | 'acres';
  certifications?: string[];
  specializations?: string[];
}

export interface OrderCreateForm {
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryAddress: Omit<Location, 'id'>;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OrderCreate: { productId?: string };
  OrderDetail: { orderId: string };
  ProductDetail: { productId: string };
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Marketplace: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Component prop types
export interface BaseComponentProps {
  testID?: string;
  accessibilityLabel?: string;
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}