export const PRODUCT_EMOJI_MAP: Record<string, string> = {
  wheat: '🌾',
  corn: '🌽',
  maize: '🌽',
  rice: '🍚',
  soy: '🫘',
  soybean: '🫘',
  barley: '🌿',
  oat: '🌿',
  sunflower: '🌻',
  cotton: '🪴',
  potato: '🥔',
  tomato: '🍅',
  vegetable: '🥬',
  fruit: '🍎',
};

export const getProductEmoji = (product?: { name?: string; category?: string }): string => {
  if (!product) return '📦';
  const searchText = `${product.category ?? ''} ${product.name ?? ''}`.toLowerCase();
  for (const [key, emoji] of Object.entries(PRODUCT_EMOJI_MAP)) {
    if (searchText.includes(key)) return emoji;
  }
  return '📦';
};
