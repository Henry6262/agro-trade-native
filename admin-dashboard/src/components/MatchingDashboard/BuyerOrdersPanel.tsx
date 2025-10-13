import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface BuyListing {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  deliveryAddressId: string;
  status: string;
  createdAt: string;
  buyer?: {
    id: string;
    businessName: string;
  };
  product?: {
    id: string;
    name: string;
  };
  deliveryAddress?: {
    id: string;
    city: string;
    region: string;
    address: string;
  };
}

interface BuyerOrdersPanelProps {
  selectedOrderId?: string;
  onOrderSelect: (order: BuyListing) => void;
}

export const BuyerOrdersPanel: React.FC<BuyerOrdersPanelProps> = ({
  selectedOrderId,
  onOrderSelect,
}) => {
  const [orders, setOrders] = useState<BuyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/listings');
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching buyer orders:', err);
      setError('Failed to load buyer orders');
    } finally {
      setLoading(false);
    }
  };

  // Group orders by corporation
  const groupedOrders = orders.reduce((acc, order) => {
    const corp = order.buyer?.businessName || 'Unknown Corporation';
    if (!acc[corp]) {
      acc[corp] = [];
    }
    acc[corp].push(order);
    return acc;
  }, {} as Record<string, BuyListing[]>);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Loading buyer orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <h3 className="font-bold text-lg">Buyer Orders</h3>
        <p className="text-sm text-gray-600">{orders.length} active orders</p>
      </div>

      <div className="p-4 space-y-4">
        {Object.entries(groupedOrders).map(([corporation, corpOrders]) => (
          <div key={corporation} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-semibold text-sm">{corporation}</h4>
              <p className="text-xs text-gray-600">{corpOrders.length} orders</p>
            </div>
            <div className="divide-y divide-gray-200">
              {corpOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onOrderSelect(order)}
                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedOrderId === order.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{order.product?.name || 'Unknown Product'}</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        📍 {order.deliveryAddress?.city || 'Unknown'}, {order.deliveryAddress?.region || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {order.quantity} {order.unit}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Target: €{order.targetPrice}/{order.unit}
                        </span>
                      </div>
                    </div>
                    {selectedOrderId === order.id && (
                      <div className="ml-2">
                        <span className="text-blue-600 text-xl">→</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerOrdersPanel;
