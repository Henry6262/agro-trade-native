import type { ProductSpecification } from '@shared/types/onboarding';

export interface ProductSpecificationsProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onSpecificationsChange: (specifications: ProductSpecification[]) => void;
}
