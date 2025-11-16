import type { ProductSelectionMetadata } from "./types";
import { getApiUrl } from "@shared/utils/environment";

export const productSelectionService = {
  buildMetadata(products: any[], selection: string[]): ProductSelectionMetadata[] {
    return selection.map((id) => {
      const product = products.find((p) => p.id === id);
      return {
        id: product?.id ?? id,
        category: product?.category ?? id,
        name: product?.displayName ?? product?.name ?? "Unknown Product",
        image: product?.image ?? null,
        specifications: product?.specifications ?? [],
      };
    });
  },
  resolveImageUri(imagePath: string | null): string | null {
    if (!imagePath) {
      return null;
    }
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    const base = getApiUrl().replace("/api", "");
    return `${base}/static/${imagePath}`;
  },
};
