export interface PriceAlert {
  id: string;
  product: string;
  condition: 'above' | 'below';
  targetPrice: number;
  triggered?: boolean;
  createdAt?: string;
}
