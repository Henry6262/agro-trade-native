import { apiClient } from './api';
import {
  Product,
  ProductCategory,
  ApiResponse,
  PaginatedResponse,
} from '../types';

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

    return apiClient.get<PaginatedResponse<Product>>(`/products?${queryParams.toString()}`);
  },

  // Get single product
  getProduct: async (productId: string): Promise<Product> => {
    return apiClient.get<ApiResponse<Product>>(`/products/${productId}`)
      .then((response) => response.data);
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 10): Promise<Product[]> => {
    return apiClient.get<ApiResponse<Product[]>>(`/products/featured?limit=${limit}`)
      .then((response) => response.data);
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
    return apiClient.get<ApiResponse<ProductCategory[]>>('/products/categories')
      .then((response) => response.data);
  },

  // Get product metadata (for onboarding)
  getProductMetadata: async (): Promise<any> => {
    return apiClient.get<ApiResponse<any>>('/products/metadata')
      .then((response) => response.data);
  },

  // Get categories with metadata (for product selection)
  getCategoriesWithMetadata: async (): Promise<any[]> => {
    return apiClient.get<ApiResponse<any[]>>('/products/categories')
      .then((response) => response.data);
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
    return apiClient.get<ApiResponse<Product[]>>(`/products/${productId}/similar?limit=${limit}`)
      .then((response) => response.data);
  },

  // Get product recommendations for user
  getRecommendedProducts: async (limit: number = 10): Promise<Product[]> => {
    return apiClient.get<ApiResponse<Product[]>>(`/products/recommendations?limit=${limit}`)
      .then((response) => response.data);
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
    return apiClient.post<ApiResponse<any>>(`/products/${productId}/check-availability`, {
      quantity,
    }).then((response) => response.data);
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
    return apiClient.get<PaginatedResponse<any>>(
      `/products/${productId}/reviews?page=${page}&limit=${limit}`
    );
  },

  // Add product to wishlist
  addToWishlist: async (productId: string): Promise<void> => {
    return apiClient.post(`/products/${productId}/wishlist`);
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId: string): Promise<void> => {
    return apiClient.delete(`/products/${productId}/wishlist`);
  },

  // Get user's wishlist
  getWishlist: async (): Promise<Product[]> => {
    return apiClient.get<ApiResponse<Product[]>>('/products/wishlist')
      .then((response) => response.data);
  },

  // Report product
  reportProduct: async (
    productId: string,
    reason: string,
    description?: string
  ): Promise<void> => {
    return apiClient.post(`/products/${productId}/report`, {
      reason,
      description,
    });
  },
};