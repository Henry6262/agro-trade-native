import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, DollarSign, AlertCircle, CheckCircle, XCircle, Send, Map } from 'lucide-react';
import { transportRequestService, transportBidService, transportJobService } from '../services/transportApi';
import TransportBidMap from './TransportBidMap';
import * as Types from '../types';

interface TransportManagementProps {
  tradeOperation: Types.TradeOperation;
  onUpdate?: () => void;
}

export default function TransportManagement({ tradeOperation, onUpdate }: TransportManagementProps) {
  const [transportRequest, setTransportRequest] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [transportJob, setTransportJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [showBidMap, setShowBidMap] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  useEffect(() => {
    loadTransportData();
  }, [tradeOperation.id]);

  const loadTransportData = async () => {
    try {
      setLoading(true);
      
      // Check if transport request exists
      const requests = await transportRequestService.getAll();
      const request = requests.data?.find((r: any) => r.tradeOperationId === tradeOperation.id);
      
      if (request) {
        setTransportRequest(request);
        
        // Load bids for this request
        const bidsData = await transportRequestService.getBidsForRequest(request.id);
        setBids(bidsData);
        
        // Check if job exists
        const job = await transportJobService.getByTradeOperation(tradeOperation.id);
        setTransportJob(job);
      }
    } catch (error) {
      console.error('Failed to load transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransportRequest = async () => {
    try {
      setCreatingRequest(true);
      
      // Calculate total weight from accepted sellers
      const totalWeight = tradeOperation.sellers
        ?.filter(s => s.status === 'ACCEPTED')
        .reduce((sum, s) => sum + (s.agreedQuantity || s.requestedQuantity || 0), 0) || 0;
      
      // Create transport request
      const request = await transportRequestService.create({
        tradeOperationId: tradeOperation.id,
        totalWeight,
        biddingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        urgencyLevel: 'STANDARD',
        maxBudget: tradeOperation.estimatedTransportCost || 5000,
      });
      
      setTransportRequest(request);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to create transport request:', error);
      alert('Failed to create transport request');
    } finally {
      setCreatingRequest(false);
    }
  };

  const acceptBid = async (bidId: string) => {
    try {
      await transportBidService.accept(bidId);
      await loadTransportData();
      onUpdate?.();
      alert('Bid accepted and transport job created!');
    } catch (error) {
      console.error('Failed to accept bid:', error);
      alert('Failed to accept bid');
    }
  };

  const rejectBid = async (bidId: string) => {
    try {
      await transportBidService.reject(bidId, 'Price too high');
      await loadTransportData();
    } catch (error) {
      console.error('Failed to reject bid:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'ACCEPTED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading transport data...</p>
      </div>
    );
  }

  // If no transport request exists and sellers have accepted, show create button
  if (!transportRequest && tradeOperation.phase === 'SELLER_NEGOTIATION') {
    const acceptedSellers = tradeOperation.sellers?.filter(s => s.status === 'ACCEPTED') || [];
    const allSellersResponded = tradeOperation.sellers?.every(s => 
      s.status === 'ACCEPTED' || s.status === 'REJECTED'
    ) || false;

    if (acceptedSellers.length > 0 && allSellersResponded) {
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Truck className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for Transport</h3>
            <p className="text-gray-600 mb-4">
              All sellers have responded. Create a transport request to get bids from transporters.
            </p>
            <button
              onClick={createTransportRequest}
              disabled={creatingRequest}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {creatingRequest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Transport Request
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Waiting for Seller Responses</h3>
          <p className="text-gray-600">
            Transport request will be available once all sellers have responded to their offers.
          </p>
        </div>
      </div>
    );
  }

  // Show transport job if exists
  if (transportJob) {
    return (
      <div className="p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Transport Assigned
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transportJob.status)}`}>
              {transportJob.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Job Number</p>
              <p className="font-semibold">{transportJob.jobNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transporter</p>
              <p className="font-semibold">{transportJob.transporter?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold">{transportJob.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Arrival</p>
              <p className="font-semibold">
                {transportJob.estimatedArrival 
                  ? new Date(transportJob.estimatedArrival).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
          </div>

          {transportJob.currentLocation && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{transportJob.currentLocation.address || 'In transit'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show transport request and bids
  return (
    <div className="p-6">
      {transportRequest && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Transport Request #{transportRequest.requestNumber}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transportRequest.status)}`}>
                {transportRequest.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="font-semibold">{transportRequest.totalWeight} tons</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bidding Deadline</p>
                <p className="font-semibold">
                  {new Date(transportRequest.biddingDeadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Budget</p>
                <p className="font-semibold">€{transportRequest.maxBudget || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bids Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Transport Bids ({bids.length})
          </h4>
          {bids.length > 0 && (
            <button
              onClick={() => setShowBidMap(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              View on Map
            </button>
          )}
        </div>

        {bids.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Waiting for transporters to submit bids...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => (
              <div key={bid.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Truck className="w-8 h-8 text-gray-600" />
                      <div>
                        <p className="font-semibold">{bid.transporter?.name || 'Unknown Transporter'}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 inline" />
                            €{bid.bidAmount}
                          </span>
                          <span className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline" />
                            {bid.estimatedDuration} hours
                          </span>
                          <span className="text-sm text-gray-600">
                            Vehicle: {bid.vehicleType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {bid.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptBid(bid.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => rejectBid(bid.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {bid.status !== 'PENDING' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                      {bid.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transport Bid Map Modal */}
      {showBidMap && (
        <TransportBidMap
          bids={bids.map((bid, index) => ({
            ...bid,
            transporter: {
              ...bid.transporter,
              // Mock coordinates for demo - in production, these come from database
              coordinates: {
                lat: 42.6977 + (Math.random() - 0.5) * 2, // Bulgaria area
                lng: 23.3219 + (Math.random() - 0.5) * 3,
              },
              rating: 4.5 + Math.random() * 0.5,
            },
            distanceFromPickup: Math.round(50 + Math.random() * 200), // km
          }))}
          pickupPoints={tradeOperation.sellers?.filter(s => s.status === 'ACCEPTED').map((seller, index) => ({
            id: seller.id,
            sellerId: seller.sellerId,
            sellerName: seller.seller?.name || `Seller ${index + 1}`,
            location: typeof seller.seller?.location === 'object'
              ? seller.seller.location.address || 'Unknown Location'
              : seller.seller?.location || 'Unknown Location',
            coordinates: {
              lat: 42.5 + (Math.random() - 0.5) * 1.5,
              lng: 23.0 + (Math.random() - 0.5) * 2,
            },
            quantity: seller.agreedQuantity || seller.requestedQuantity || 0,
            unit: seller.unit || 'tons',
          })) || []}
          deliveryPoint={{
            id: tradeOperation.buyListing?.id || '1',
            buyerId: tradeOperation.buyListing?.buyerId || '',
            buyerName: tradeOperation.buyListing?.buyer?.name || 'Buyer',
            location: tradeOperation.buyListing?.buyer?.city || 'Delivery Location',
            coordinates: {
              lat: 42.6977, // Sofia coordinates as default
              lng: 23.3219,
            },
          }}
          selectedBidId={selectedBidId}
          onBidSelect={(bidId) => setSelectedBidId(bidId)}
          onClose={() => {
            setShowBidMap(false);
            setSelectedBidId(null);
          }}
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}
        />
      )}
    </div>
  );
}