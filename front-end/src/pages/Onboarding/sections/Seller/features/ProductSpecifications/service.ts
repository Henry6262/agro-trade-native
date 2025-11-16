import { productService } from "@services/productService";

export const productSpecificationsService = {
  async loadSelectedMetadata(selectedProducts: string[]) {
    const categoriesResponse = await productService.getCategoriesWithMetadata();
    return categoriesResponse.filter((cat: any) =>
      selectedProducts.includes(cat.category)
    );
  },
};
