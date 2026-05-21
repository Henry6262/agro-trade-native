import { create } from 'zustand';

interface ProductStore {
  selectedProduct: any | null;
  setSelectedProduct: (product: any) => void;
  clearSelectedProduct: () => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  clearSelectedProduct: () => set({ selectedProduct: null }),
}));
