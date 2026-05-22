export interface PriceAlert {
  id: string;
  product: string;
  symbol?: string;
  condition: 'above' | 'below';
  targetPrice: number;
  threshold?: number;
  triggered?: boolean;
  createdAt?: string;
}
