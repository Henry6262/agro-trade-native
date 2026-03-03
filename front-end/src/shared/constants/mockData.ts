import type {
  ProductCategory,
  OnboardingCard,
  MarketInsights,
  TransportOpportunities,
  Location,
  VehicleType,
} from '../types';

// Role selection cards
export const ROLE_CARDS: OnboardingCard[] = [
  {
    id: 'seller',
    title: 'I am a Seller',
    description: 'I grow and sell agricultural products',
    icon: '🌾',
    backgroundImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'buyer',
    title: 'I am a Buyer',
    description: 'I purchase agricultural products for my business',
    icon: '🏭',
    backgroundImage: 'https://images.unsplash.com/photo-1459789034005-ba29c5783491?w=400&q=80',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#1d4ed8'],
  },
  {
    id: 'transport',
    title: 'I provide Transport',
    description: 'I transport goods between sellers and buyers',
    icon: '🚛',
    backgroundImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
];

// Product categories with images
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    slug: 'wheat',
    description: 'Various types of wheat grains',
    icon: '🌾',
  },
  {
    id: 'forage',
    name: 'Forage & Feed',
    slug: 'forage',
    description: 'Animal feed and forage crops',
    icon: '🌿',
  },
  {
    id: 'corn',
    name: 'Corn',
    slug: 'corn',
    description: 'Corn and maize products',
    icon: '🌽',
  },
  {
    id: 'rice',
    name: 'Rice',
    slug: 'rice',
    description: 'Rice varieties and products',
    icon: '🍚',
  },
  {
    id: 'soybeans',
    name: 'Soybeans',
    slug: 'soybeans',
    description: 'Soybean crops and products',
    icon: '🫘',
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Fresh vegetables and produce',
    icon: '🥕',
  },
  {
    id: 'fruits',
    name: 'Fruits',
    slug: 'fruits',
    description: 'Fresh fruits and citrus',
    icon: '🍎',
  },
  {
    id: 'dairy',
    name: 'Dairy',
    slug: 'dairy',
    description: 'Milk and dairy products',
    icon: '🥛',
  },
];

// Individual products with more details
export const MOCK_PRODUCTS = [
  // Wheat products
  {
    id: 'wheat-hard-red-winter',
    name: 'Hard Red Winter Wheat',
    category: 'wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    varieties: ['Turkey Red', 'Jagger', 'Everest', 'Gallagher'],
    description: 'Premium hard red winter wheat suitable for bread making',
    averagePrice: 280,
    unit: 'per ton',
    inSeason: true,
  },
  {
    id: 'wheat-soft-white',
    name: 'Soft White Wheat',
    category: 'wheat',
    image: 'https://images.unsplash.com/photo-1562832135-14a35d25edef?w=400&q=80',
    varieties: ['Stephens', 'Madsen', 'Goetze', 'Palouse'],
    description: 'Ideal for pastries, crackers, and Asian noodles',
    averagePrice: 260,
    unit: 'per ton',
    inSeason: true,
  },
  // Forage products
  {
    id: 'alfalfa-hay',
    name: 'Alfalfa Hay',
    category: 'forage',
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&q=80',
    varieties: ['Supreme', 'Premium', 'Good', 'Fair'],
    description: 'High-quality alfalfa hay for livestock feed',
    averagePrice: 180,
    unit: 'per ton',
    inSeason: true,
  },
  {
    id: 'corn-silage',
    name: 'Corn Silage',
    category: 'forage',
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80',
    varieties: ['Whole Plant', 'High Moisture', 'Dry Matter'],
    description: 'Fermented corn silage for cattle feed',
    averagePrice: 45,
    unit: 'per ton',
    inSeason: false,
  },
  // Corn products
  {
    id: 'field-corn',
    name: 'Field Corn',
    category: 'corn',
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80',
    varieties: ['Dent Corn', 'Flint Corn', 'Sweet Corn'],
    description: 'Yellow field corn for feed and processing',
    averagePrice: 220,
    unit: 'per ton',
    inSeason: true,
  },
  // Rice products
  {
    id: 'long-grain-rice',
    name: 'Long Grain Rice',
    category: 'rice',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    varieties: ['Jasmine', 'Basmati', 'Regular Long Grain'],
    description: 'Premium long grain rice for export',
    averagePrice: 650,
    unit: 'per ton',
    inSeason: true,
  },
  // Soybeans
  {
    id: 'soybeans',
    name: 'Soybeans',
    category: 'soybeans',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=80',
    varieties: ['Yellow Soybeans', 'Black Soybeans', 'Edamame'],
    description: 'High-protein soybeans for feed and processing',
    averagePrice: 450,
    unit: 'per ton',
    inSeason: false,
  },
  // Vegetables
  {
    id: 'potatoes',
    name: 'Potatoes',
    category: 'vegetables',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    varieties: ['Russet', 'Red', 'Yellow', 'Fingerling'],
    description: 'Fresh potatoes for retail and processing',
    averagePrice: 350,
    unit: 'per ton',
    inSeason: true,
  },
  {
    id: 'onions',
    name: 'Onions',
    category: 'vegetables',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    varieties: ['Yellow', 'White', 'Red', 'Sweet'],
    description: 'Fresh storage onions',
    averagePrice: 400,
    unit: 'per ton',
    inSeason: true,
  },
];

// Market insights data
export const MOCK_MARKET_INSIGHTS: MarketInsights = {
  activeBuyers: 2847,
  currentDemand: [
    {
      productId: 'wheat-hard-red-winter',
      productName: 'Hard Red Winter Wheat',
      demandLevel: 'very_high',
      buyersCount: 156,
      totalQuantityDemanded: 4500,
    },
    {
      productId: 'alfalfa-hay',
      productName: 'Alfalfa Hay',
      demandLevel: 'high',
      buyersCount: 89,
      totalQuantityDemanded: 2200,
    },
    {
      productId: 'corn-silage',
      productName: 'Corn Silage',
      demandLevel: 'medium',
      buyersCount: 34,
      totalQuantityDemanded: 1800,
    },
    {
      productId: 'soybeans',
      productName: 'Soybeans',
      demandLevel: 'high',
      buyersCount: 67,
      totalQuantityDemanded: 3200,
    },
  ],
  trendingProducts: ['Hard Red Winter Wheat', 'Soybeans', 'Alfalfa Hay', 'Long Grain Rice'],
  averagePrices: [
    {
      productId: 'wheat-hard-red-winter',
      productName: 'Hard Red Winter Wheat',
      averagePrice: 280,
      priceChange: 5.2,
      currency: 'USD',
    },
    {
      productId: 'alfalfa-hay',
      productName: 'Alfalfa Hay',
      averagePrice: 180,
      priceChange: -2.1,
      currency: 'USD',
    },
    {
      productId: 'soybeans',
      productName: 'Soybeans',
      averagePrice: 450,
      priceChange: 8.7,
      currency: 'USD',
    },
  ],
};

// Vehicle types for transport
export const VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'semi-truck',
    name: 'Semi-Truck',
    capacity: 25,
    suitable_for: ['grain', 'bulk', 'packaged'],
  },
  {
    id: 'box-truck',
    name: 'Box Truck',
    capacity: 5,
    suitable_for: ['packaged', 'produce', 'dairy'],
  },
  {
    id: 'flatbed',
    name: 'Flatbed Truck',
    capacity: 20,
    suitable_for: ['baled', 'machinery', 'bulk'],
  },
  {
    id: 'refrigerated',
    name: 'Refrigerated Truck',
    capacity: 15,
    suitable_for: ['produce', 'dairy', 'meat'],
  },
  {
    id: 'grain-trailer',
    name: 'Grain Trailer',
    capacity: 30,
    suitable_for: ['grain', 'seeds'],
  },
];

// Sample locations
export const SAMPLE_LOCATIONS: Location[] = [
  {
    id: 'kansas-city',
    address: 'Kansas City',
    city: 'Kansas City',
    state: 'Kansas',
    country: 'USA',
    zipCode: '66101',
    latitude: 39.0997,
    longitude: -94.5786,
  },
  {
    id: 'omaha',
    address: 'Omaha',
    city: 'Omaha',
    state: 'Nebraska',
    country: 'USA',
    zipCode: '68102',
    latitude: 41.2565,
    longitude: -95.9345,
  },
  {
    id: 'chicago',
    address: 'Chicago',
    city: 'Chicago',
    state: 'Illinois',
    country: 'USA',
    zipCode: '60601',
    latitude: 41.8781,
    longitude: -87.6298,
  },
];

// Transport opportunities
export const MOCK_TRANSPORT_OPPORTUNITIES: TransportOpportunities = {
  availableJobs: 234,
  potentialEarnings: 8500,
  popularRoutes: [
    {
      id: 'kansas-chicago',
      origin: 'Kansas City, KS',
      destination: 'Chicago, IL',
      distance: 525,
      estimatedEarnings: 850,
      frequency: 12,
    },
    {
      id: 'omaha-milwaukee',
      origin: 'Omaha, NE',
      destination: 'Milwaukee, WI',
      distance: 468,
      estimatedEarnings: 720,
      frequency: 8,
    },
    {
      id: 'minneapolis-denver',
      origin: 'Minneapolis, MN',
      destination: 'Denver, CO',
      distance: 925,
      estimatedEarnings: 1200,
      frequency: 6,
    },
  ],
  demandHotspots: SAMPLE_LOCATIONS,
};

// Cargo types for transport
export const CARGO_TYPES = [
  { id: 'grain', name: 'Grain & Seeds', icon: '🌾' },
  { id: 'produce', name: 'Fresh Produce', icon: '🥕' },
  { id: 'dairy', name: 'Dairy Products', icon: '🥛' },
  { id: 'meat', name: 'Meat & Poultry', icon: '🥩' },
  { id: 'bulk', name: 'Bulk Materials', icon: '📦' },
  { id: 'packaged', name: 'Packaged Foods', icon: '📫' },
  { id: 'baled', name: 'Baled Hay/Straw', icon: '🟫' },
  { id: 'liquid', name: 'Liquid Products', icon: '🛢️' },
];

// Units for quantity selection
export const QUANTITY_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)', short: 'kg' },
  { value: 'tons', label: 'Tons', short: 'tons' },
  { value: 'bags', label: 'Bags', short: 'bags' },
  { value: 'boxes', label: 'Boxes', short: 'boxes' },
  { value: 'liters', label: 'Liters', short: 'L' },
];

// Quality grades
export const QUALITY_GRADES = [
  { value: 'A', label: 'Grade A - Premium', description: 'Highest quality, premium grade' },
  { value: 'B', label: 'Grade B - Good', description: 'Good quality, standard grade' },
  { value: 'C', label: 'Grade C - Fair', description: 'Fair quality, basic grade' },
];

// Price ranges for different products (in USD per ton)
export const PRICE_RANGES = {
  wheat: { min: 200, max: 350 },
  forage: { min: 120, max: 250 },
  corn: { min: 180, max: 280 },
  rice: { min: 500, max: 800 },
  soybeans: { min: 350, max: 550 },
  vegetables: { min: 300, max: 600 },
  fruits: { min: 400, max: 900 },
  dairy: { min: 800, max: 1500 },
};
