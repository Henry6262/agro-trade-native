import { apiClient } from './api';
import {
  Product,
  ProductCategory,
  ApiResponse,
  PaginatedResponse,
} from '../shared/types';

export interface ProductsListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  location?: string;
  sellerId?: string;
  sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export const productService = {
  // Get products list with filtering and pagination
  getProducts: async (params: ProductsListParams = {}): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Get single product
  getProduct: async (productId: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${productId}`);
    return response.data;
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 10): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/featured?limit=${limit}`);
    return response.data;
  },

  // Search products
  searchProducts: async (
    query: string,
    filters: Omit<ProductsListParams, 'search'> = {}
  ): Promise<PaginatedResponse<Product>> => {
    const params = { ...filters, search: query };
    return productService.getProducts(params);
  },

  // Get products by category
  getProductsByCategory: async (
    categoryId: string,
    params: Omit<ProductsListParams, 'category'> = {}
  ): Promise<PaginatedResponse<Product>> => {
    return productService.getProducts({ ...params, category: categoryId });
  },

  // Get product categories with metadata
  getCategories: async (): Promise<ProductCategory[]> => {
    const response = await apiClient.get<ProductCategory[]>('/products/categories');
    return response.data;
  },

  // Get product metadata (for onboarding)
  getProductMetadata: async (): Promise<any> => {
    const response = await apiClient.get<any>('/products/metadata');
    // The apiClient returns { data: T }, and the API returns { data: [...], message, success }
    // So we need to extract the actual data array
    return response.data?.data || response.data || [];
  },

  // Get categories with metadata (for product selection)
  getCategoriesWithMetadata: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/products/categories');
    return response.data;
  },

  // Get products by seller
  getProductsBySeller: async (
    sellerId: string,
    params: Omit<ProductsListParams, 'sellerId'> = {}
  ): Promise<PaginatedResponse<Product>> => {
    return productService.getProducts({ ...params, sellerId });
  },

  // Get similar products
  getSimilarProducts: async (
    productId: string,
    limit: number = 5
  ): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/${productId}/similar?limit=${limit}`);
    return response.data;
  },

  // Get product recommendations for user
  getRecommendedProducts: async (limit: number = 10): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/recommendations?limit=${limit}`);
    return response.data;
  },

  // Check product availability
  checkAvailability: async (
    productId: string,
    quantity: number
  ): Promise<{
    available: boolean;
    maxQuantity: number;
    message?: string;
  }> => {
    const response = await apiClient.post<any>(`/products/${productId}/check-availability`, {
      quantity,
    });
    return response.data;
  },

  // Get product reviews
  getProductReviews: async (
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    review: string;
    createdAt: string;
  }>> => {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/products/${productId}/reviews?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Add product to wishlist
  addToWishlist: async (productId: string): Promise<void> => {
    await apiClient.post(`/products/${productId}/wishlist`);
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/wishlist`);
  },

  // Get user's wishlist
  getWishlist: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products/wishlist');
    return response.data;
  },

  // Report product
  reportProduct: async (
    productId: string,
    reason: string,
    description?: string
  ): Promise<void> => {
    await apiClient.post(`/products/${productId}/report`, {
      reason,
      description,
    });
  },
};