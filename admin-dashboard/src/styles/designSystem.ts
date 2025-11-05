// Agro-Trade Minimal Design System
// 4-Color Palette: White, Black, Gray, Yellow

// Product emojis for visual context (keep these - they're useful!)
export const productThemes = {
  'Soft Wheat': {
    emoji: '🌾',
  },
  'Corn': {
    emoji: '🌽',
  },
  'Sunflower Seeds': {
    emoji: '🌻',
  },
  'Barley': {
    emoji: '🌾',
  },
  'Rapeseed': {
    emoji: '🌼',
  },
};

// Specification badge styling - simple yellow tags
export const specificationThemes = {
  moisture: {
    emoji: '💧',
    label: 'Moisture',
  },
  protein: {
    emoji: '🥗',
    label: 'Protein',
  },
  grade: {
    emoji: '⭐',
    label: 'Grade',
  },
  organic: {
    emoji: '🌱',
    label: 'Organic',
  },
  certified: {
    emoji: '✅',
    label: 'Certified',
  },
  quality: {
    emoji: '💎',
    label: 'Quality',
  },
};

// Quality grade themes - simple styling
export const qualityGradeThemes = {
  A: {
    label: 'Premium',
    emoji: '👑',
  },
  B: {
    label: 'Standard',
    emoji: '⭐',
  },
  C: {
    label: 'Budget',
    emoji: '💚',
  },
};

// Helper function to get product theme
export const getProductTheme = (productName: string) => {
  return productThemes[productName as keyof typeof productThemes] || {
    emoji: '📦',
  };
};

// Helper function to get spec theme
export const getSpecTheme = (specCode: string) => {
  return specificationThemes[specCode as keyof typeof specificationThemes] || {
    emoji: '📋',
    label: 'Specification',
  };
};
