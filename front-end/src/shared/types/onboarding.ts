export type UserRole = 'seller' | 'buyer' | 'transporter';
export type SortOption =
  | 'relevance'
  | 'price-low'
  | 'price-high'
  | 'distance'
  | 'rating'
  | 'newest';

export interface StepConfig {
  id: string;
  title: string;
  description: string;
}

export interface OnboardingStep extends StepConfig {
  completed: boolean;
}

export interface FilterState {
  priceRange: [number, number];
  qualityGrade: string[];
  organic: boolean;
  distance: number;
  availability: string;
  sortBy: SortOption;
}

export interface ProductSpecification {
  productId: string;
  quantity: string;
  unit: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  icon: string;
  category: string;
  subcategory: string;
}
