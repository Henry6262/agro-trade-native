import type { ProductData } from './types';

type ProductMetadata = ProductData[];

const CATEGORY_IMAGES: Record<string, string> = {
  SOFT_WHEAT: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  HARD_WHEAT: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
  CORN: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
  SOYBEANS: 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
  RICE: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
};

export const resolveProductImage = (
  metadata: ProductMetadata,
  productName: string,
  category: string
): string => {
  const match = metadata.find(
    (product) => product.name === productName || product.displayName === productName || product.category === category
  );
  if (match?.image) {
    return match.image;
  }
  return CATEGORY_IMAGES[category] || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product';
};
