import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, ProductsListParams } from '../services/productService';

export const useProducts = () => {
  const queryClient = useQueryClient();

  // Get products with pagination
  const useProductsList = (params: ProductsListParams = {}) => {
    return useQuery({
      queryKey: ['products', params],
      queryFn: () => productService.getProducts(params),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Infinite scroll products
  const useInfiniteProducts = (params: Omit<ProductsListParams, 'page'> = {}) => {
    return useInfiniteQuery({
      queryKey: ['products', 'infinite', params],
      queryFn: ({ pageParam = 1 }) =>
        productService.getProducts({ ...params, page: pageParam }),
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage.pagination;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
      staleTime: 2 * 60 * 1000,
    });
  };

  // Get single product
  const useProduct = (productId: string) => {
    return useQuery({
      queryKey: ['product', productId],
      queryFn: () => productService.getProduct(productId),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get featured products
  const useFeaturedProducts = (limit: number = 10) => {
    return useQuery({
      queryKey: ['products', 'featured', limit],
      queryFn: () => productService.getFeaturedProducts(limit),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Get product categories
  const useCategories = () => {
    return useQuery({
      queryKey: ['categories'],
      queryFn: productService.getCategories,
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  // Search products
  const useSearchProducts = (query: string, filters: Omit<ProductsListParams, 'search'> = {}) => {
    return useQuery({
      queryKey: ['products', 'search', query, filters],
      queryFn: () => productService.searchProducts(query, filters),
      enabled: query.length > 0,
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  // Get products by category
  const useProductsByCategory = (categoryId: string, params: Omit<ProductsListParams, 'category'> = {}) => {
    return useQuery({
      queryKey: ['products', 'category', categoryId, params],
      queryFn: () => productService.getProductsByCategory(categoryId, params),
      enabled: !!categoryId,
      staleTime: 2 * 60 * 1000,
    });
  };

  // Get similar products
  const useSimilarProducts = (productId: string, limit: number = 5) => {
    return useQuery({
      queryKey: ['products', 'similar', productId, limit],
      queryFn: () => productService.getSimilarProducts(productId, limit),
      enabled: !!productId,
      staleTime: 10 * 60 * 1000,
    });
  };

  // Get recommended products
  const useRecommendedProducts = (limit: number = 10) => {
    return useQuery({
      queryKey: ['products', 'recommendations', limit],
      queryFn: () => productService.getRecommendedProducts(limit),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  // Check product availability
  const checkAvailabilityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      productService.checkAvailability(productId, quantity),
  });

  // Get product reviews
  const useProductReviews = (productId: string, page: number = 1, limit: number = 10) => {
    return useQuery({
      queryKey: ['product', productId, 'reviews', page, limit],
      queryFn: () => productService.getProductReviews(productId, page, limit),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Wishlist operations
  const addToWishlistMutation = useMutation({
    mutationFn: productService.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: productService.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const useWishlist = () => {
    return useQuery({
      queryKey: ['wishlist'],
      queryFn: productService.getWishlist,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Report product
  const reportProductMutation = useMutation({
    mutationFn: ({ productId, reason, description }: {
      productId: string;
      reason: string;
      description?: string;
    }) => productService.reportProduct(productId, reason, description),
  });

  return {
    // Query hooks
    useProductsList,
    useInfiniteProducts,
    useProduct,
    useFeaturedProducts,
    useCategories,
    useSearchProducts,
    useProductsByCategory,
    useSimilarProducts,
    useRecommendedProducts,
    useProductReviews,
    useWishlist,

    // Mutation hooks
    checkAvailability: checkAvailabilityMutation,
    addToWishlist: addToWishlistMutation,
    removeFromWishlist: removeFromWishlistMutation,
    reportProduct: reportProductMutation,
  };
};