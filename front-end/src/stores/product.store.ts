import { create } from 'zustand';

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
  code?: string;
  dataType?: string;
  minValue?: number;
  maxValue?: number;
  importance?: 'required' | 'recommended' | 'optional';
  [key: string]: any;
}

export interface ProductWithSpecs {
  id: string;
  name: string;
  displayName?: string;
  specifications?: ProductSpecification[];
  image?: string;
  category?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  [key: string]: any;
}

interface ProductStore {
  products: ProductWithSpecs[];
  selectedProduct: ProductWithSpecs | null;
  setSelectedProduct: (product: ProductWithSpecs) => void;
  clearSelectedProduct: () => void;
  fetchAllData: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  clearSelectedProduct: () => set({ selectedProduct: null }),
  fetchAllData: async () => {
    // Stub implementation
    set({ products: [] });
  },
}));
