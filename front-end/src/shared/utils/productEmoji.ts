export function getProductEmoji(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes('wheat')) return '🌾';
  if (name.includes('corn') || name.includes('maize')) return '🌽';
  if (name.includes('sunflower')) return '🌻';
  if (name.includes('barley')) return '🍺';
  if (name.includes('soy')) return '🫘';
  if (name.includes('rice')) return '🍚';
  if (name.includes('fruit')) return '🍎';
  if (name.includes('vegetable')) return '🥬';
  return '📦';
}
