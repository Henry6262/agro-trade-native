import type { OnboardingRole, StepConfig, Product } from '../types/onboarding';

export const roleSteps: Record<OnboardingRole, StepConfig[]> = {
  seller: [
    { id: 'products', title: 'Products', description: 'Choose products' },
    { id: 'specifications', title: 'Details', description: 'Add specifications' },
    { id: 'bases', title: 'Locations', description: 'Storage locations' },
    { id: 'distribution', title: 'Distribution', description: 'Stock distribution' },
    { id: 'market', title: 'Market', description: 'Create sell request' },
  ],
  buyer: [
    { id: 'products', title: 'Products', description: 'What to buy' },
    { id: 'specifications', title: 'Requirements', description: 'Your needs' },
    { id: 'bases', title: 'Delivery', description: 'Delivery locations' },
    { id: 'distribution', title: 'Distribution', description: 'Quantity per location' },
    { id: 'market', title: 'Request', description: 'Create offer' },
  ],
  transport: [
    { id: 'fleet', title: 'Fleet', description: 'Your trucks' },
    { id: 'bases', title: 'Bases', description: 'Operating locations' },
    { id: 'location', title: 'Coverage', description: 'Service areas' },
    { id: 'listing', title: 'Listing', description: 'Create profile' },
  ],
};

export const products: Product[] = [
  // Grains & Cereals
  {
    id: 'wheat',
    name: 'Wheat',
    icon: '🌾',
    category: 'Grains & Cereals',
    subcategory: 'Wheat Varieties',
  },
  { id: 'corn', name: 'Corn', icon: '🌽', category: 'Grains & Cereals', subcategory: 'Maize' },
  {
    id: 'rice',
    name: 'Rice',
    icon: '🍚',
    category: 'Grains & Cereals',
    subcategory: 'Rice Varieties',
  },
  { id: 'barley', name: 'Barley', icon: '🌾', category: 'Grains & Cereals', subcategory: 'Barley' },
  { id: 'oats', name: 'Oats', icon: '🥣', category: 'Grains & Cereals', subcategory: 'Oats' },
  {
    id: 'millet',
    name: 'Millet',
    icon: '🌾',
    category: 'Grains & Cereals',
    subcategory: 'Millets',
  },
  {
    id: 'sorghum',
    name: 'Sorghum',
    icon: '🌾',
    category: 'Grains & Cereals',
    subcategory: 'Sorghum',
  },

  // Fruits
  { id: 'apple', name: 'Apple', icon: '🍎', category: 'Fruits', subcategory: 'Tree Fruits' },
  { id: 'banana', name: 'Banana', icon: '🍌', category: 'Fruits', subcategory: 'Tropical Fruits' },
  { id: 'mango', name: 'Mango', icon: '🥭', category: 'Fruits', subcategory: 'Tropical Fruits' },
  { id: 'orange', name: 'Orange', icon: '🍊', category: 'Fruits', subcategory: 'Citrus Fruits' },
  { id: 'grapes', name: 'Grapes', icon: '🍇', category: 'Fruits', subcategory: 'Vine Fruits' },
  {
    id: 'pomegranate',
    name: 'Pomegranate',
    icon: '🍎',
    category: 'Fruits',
    subcategory: 'Tree Fruits',
  },
  { id: 'watermelon', name: 'Watermelon', icon: '🍉', category: 'Fruits', subcategory: 'Melons' },
  { id: 'papaya', name: 'Papaya', icon: '🥭', category: 'Fruits', subcategory: 'Tropical Fruits' },

  // Vegetables
  { id: 'tomato', name: 'Tomato', icon: '🍅', category: 'Vegetables', subcategory: 'Nightshades' },
  {
    id: 'onion',
    name: 'Onion',
    icon: '🧅',
    category: 'Vegetables',
    subcategory: 'Bulb Vegetables',
  },
  {
    id: 'potato',
    name: 'Potato',
    icon: '🥔',
    category: 'Vegetables',
    subcategory: 'Root Vegetables',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    icon: '🥕',
    category: 'Vegetables',
    subcategory: 'Root Vegetables',
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    icon: '🥬',
    category: 'Vegetables',
    subcategory: 'Leafy Greens',
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    icon: '🥦',
    category: 'Vegetables',
    subcategory: 'Cruciferous',
  },
  {
    id: 'spinach',
    name: 'Spinach',
    icon: '🥬',
    category: 'Vegetables',
    subcategory: 'Leafy Greens',
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    icon: '🍆',
    category: 'Vegetables',
    subcategory: 'Nightshades',
  },

  // Pulses & Legumes
  {
    id: 'chickpea',
    name: 'Chickpea',
    icon: '🫘',
    category: 'Pulses & Legumes',
    subcategory: 'Chickpeas',
  },
  {
    id: 'lentil',
    name: 'Lentil',
    icon: '🫘',
    category: 'Pulses & Legumes',
    subcategory: 'Lentils',
  },
  {
    id: 'blackgram',
    name: 'Black Gram',
    icon: '🫘',
    category: 'Pulses & Legumes',
    subcategory: 'Gram',
  },
  {
    id: 'greengram',
    name: 'Green Gram',
    icon: '🫘',
    category: 'Pulses & Legumes',
    subcategory: 'Gram',
  },
  {
    id: 'pigeon-pea',
    name: 'Pigeon Pea',
    icon: '🫘',
    category: 'Pulses & Legumes',
    subcategory: 'Peas',
  },

  // Spices & Herbs
  {
    id: 'turmeric',
    name: 'Turmeric',
    icon: '🌿',
    category: 'Spices & Herbs',
    subcategory: 'Rhizomes',
  },
  { id: 'ginger', name: 'Ginger', icon: '🫚', category: 'Spices & Herbs', subcategory: 'Rhizomes' },
  { id: 'garlic', name: 'Garlic', icon: '🧄', category: 'Spices & Herbs', subcategory: 'Bulbs' },
  {
    id: 'coriander',
    name: 'Coriander',
    icon: '🌿',
    category: 'Spices & Herbs',
    subcategory: 'Seeds',
  },
  { id: 'cumin', name: 'Cumin', icon: '🌿', category: 'Spices & Herbs', subcategory: 'Seeds' },
  { id: 'chili', name: 'Chili', icon: '🌶️', category: 'Spices & Herbs', subcategory: 'Peppers' },

  // Oilseeds
  { id: 'mustard', name: 'Mustard', icon: '🌻', category: 'Oilseeds', subcategory: 'Mustard' },
  {
    id: 'sunflower',
    name: 'Sunflower',
    icon: '🌻',
    category: 'Oilseeds',
    subcategory: 'Sunflower',
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    icon: '🥜',
    category: 'Oilseeds',
    subcategory: 'Groundnuts',
  },
  { id: 'sesame', name: 'Sesame', icon: '🌰', category: 'Oilseeds', subcategory: 'Sesame' },

  // Cash Crops
  { id: 'cotton', name: 'Cotton', icon: '🌱', category: 'Cash Crops', subcategory: 'Fiber Crops' },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    icon: '🎋',
    category: 'Cash Crops',
    subcategory: 'Sugar Crops',
  },
  { id: 'tobacco', name: 'Tobacco', icon: '🌿', category: 'Cash Crops', subcategory: 'Tobacco' },

  // Dairy & Livestock
  {
    id: 'milk',
    name: 'Milk',
    icon: '🥛',
    category: 'Dairy & Livestock',
    subcategory: 'Dairy Products',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: '🥚',
    category: 'Dairy & Livestock',
    subcategory: 'Poultry Products',
  },
  {
    id: 'honey',
    name: 'Honey',
    icon: '🍯',
    category: 'Dairy & Livestock',
    subcategory: 'Bee Products',
  },
];

export const categories = [
  'all',
  'Grains & Cereals',
  'Fruits',
  'Vegetables',
  'Pulses & Legumes',
  'Spices & Herbs',
  'Oilseeds',
  'Cash Crops',
  'Dairy & Livestock',
];

export const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Standard', 'Organic Certified'];

export const sortOptions = [
  { value: 'relevance', label: 'Most Relevant', icon: 'Star' },
  { value: 'price-low', label: 'Price: Low to High', icon: 'DollarSign' },
  { value: 'price-high', label: 'Price: High to Low', icon: 'DollarSign' },
  { value: 'distance', label: 'Nearest First', icon: 'MapPin' },
  { value: 'rating', label: 'Highest Rated', icon: 'Star' },
  { value: 'newest', label: 'Recently Added', icon: 'Clock' },
];
