import { useEffect } from 'react';
import { useUserData } from '@contexts/UserDataContext';
import { useProductStore } from '@stores/product.store';

export const useSellerProducts = () => {
  const {
    sellerProducts,
    isLoadingProducts,
    productsError,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useUserData();

  const productMetadata = useProductStore((state) => state.products) || [];
  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);

  useEffect(() => {
    if (productMetadata.length === 0) {
      fetchProductMetadata().catch((error) =>
        console.error('Failed to fetch product metadata', error)
      );
    }
  }, [productMetadata.length, fetchProductMetadata]);

  return {
    sellerProducts,
    isLoadingProducts,
    productsError,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    productMetadata,
  };
};
