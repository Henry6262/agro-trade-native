export interface ProductSelectionMetadata {
  id: string;
  category: string;
  name: string;
  image: string | null;
  specifications: any[];
}

export type ProductSelectionRole = 'seller' | 'buyer' | string | null;
