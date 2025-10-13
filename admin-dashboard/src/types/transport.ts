export interface TransportRequest {
  id: string;
  tradeOperationId: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED';
  pickupPoints: PickupPoint[];
  deliveryPoint: DeliveryPoint;
  totalDistance: number;
  estimatedCost: number;
  biddingDeadline: string;
  createdAt: string;
  bids: TransportBid[];
  tradeOperation: {
    operationNumber: string;
    buyer: { businessName: string };
    totalQuantity: number;
  };
  trucksNeeded: number;
  trucksReserved: number;
}

export interface PickupPoint {
  sellerId: string;
  saleListingId: string;
  address: string;
  latitude: number;
  longitude: number;
  quantity: number;
  unit: string;
}

export interface DeliveryPoint {
  addressId: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface TransportBid {
  id: string;
  transportRequestId: string;
  transportCompanyId: string;
  companyName: string;
  truckCount: number;
  bidAmount: number;
  estimatedDuration: number;
  vehicleType: 'FLATBED' | 'REFRIGERATED' | 'TANKER' | 'CONTAINER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  rating?: number;
}

export type TransportRequestStatus = 'OPEN' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED';
export type TransportBidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
