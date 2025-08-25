export const PRODUCTS = [
  {
    id: "wheat",
    name: "Wheat",
    description: "Premium quality wheat grains",
    icon: "🌾",
    specifications: {
      moisture: { min: 10, max: 14, unit: "%" },
      protein: { min: 10, max: 14, unit: "%" },
      test_weight: { min: 74, max: 82, unit: "kg/hl" },
      foreign_matter: { min: 0, max: 2, unit: "%" },
    },
  },
  {
    id: "rice",
    name: "Rice",
    description: "Long grain white rice",
    icon: "🌾",
    specifications: {
      moisture: { min: 11, max: 14, unit: "%" },
      broken_percentage: { min: 0, max: 5, unit: "%" },
      chalky_grains: { min: 0, max: 3, unit: "%" },
      foreign_matter: { min: 0, max: 0.5, unit: "%" },
    },
  },
  {
    id: "corn",
    name: "Corn",
    description: "Yellow corn for various uses",
    icon: "🌽",
    specifications: {
      moisture: { min: 12, max: 14.5, unit: "%" },
      test_weight: { min: 68, max: 72, unit: "kg/hl" },
      broken_kernels: { min: 0, max: 3, unit: "%" },
      aflatoxin: { min: 0, max: 20, unit: "ppb" },
    },
  },
  {
    id: "soybeans",
    name: "Soybeans",
    description: "High-protein soybeans",
    icon: "🫘",
    specifications: {
      moisture: { min: 10, max: 13, unit: "%" },
      protein: { min: 34, max: 38, unit: "%" },
      oil_content: { min: 18, max: 22, unit: "%" },
      foreign_matter: { min: 0, max: 2, unit: "%" },
    },
  },
  {
    id: "coffee",
    name: "Coffee Beans",
    description: "Arabica coffee beans",
    icon: "☕",
    specifications: {
      moisture: { min: 10, max: 12.5, unit: "%" },
      screen_size: { min: 15, max: 18, unit: "mm" },
      defects: { min: 0, max: 5, unit: "%" },
      cupping_score: { min: 80, max: 90, unit: "points" },
    },
  },
  {
    id: "cotton",
    name: "Cotton",
    description: "Raw cotton fibers",
    icon: "🏳️",
    specifications: {
      moisture: { min: 6, max: 8, unit: "%" },
      staple_length: { min: 26, max: 32, unit: "mm" },
      micronaire: { min: 3.5, max: 4.9, unit: "μg/inch" },
      strength: { min: 26, max: 32, unit: "g/tex" },
    },
  },
]

export const MARKET_CONDITIONS = {
  demand: {
    wheat: { level: "high", trend: "rising", premium: 5 },
    rice: { level: "medium", trend: "stable", premium: 0 },
    corn: { level: "high", trend: "rising", premium: 3 },
    soybeans: { level: "medium", trend: "falling", premium: -2 },
    coffee: { level: "low", trend: "stable", premium: 0 },
    cotton: { level: "high", trend: "rising", premium: 4 },
  },
  averagePrices: {
    wheat: { min: 250, max: 320, currency: "USD/ton" },
    rice: { min: 400, max: 550, currency: "USD/ton" },
    corn: { min: 180, max: 240, currency: "USD/ton" },
    soybeans: { min: 420, max: 480, currency: "USD/ton" },
    coffee: { min: 3200, max: 4500, currency: "USD/ton" },
    cotton: { min: 1800, max: 2200, currency: "USD/ton" },
  },
}