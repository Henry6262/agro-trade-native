import React, { useState, useEffect } from 'react';
import * as Types from '../types';
import { 
  tradeOperationService,
  negotiationService,
  inspectionService,
  profitService
} from '../services/api';
import TransportManagement from './TransportManagement';
// import ReplacementSellerFinder from './ReplacementSellerFinder'; // Disabled - not part of Phase 1
import { 
  X,
  RefreshCw,
  Package,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Send,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Shield,
  AlertTriangle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  operation: Types.TradeOperation | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const TradeDetails: React.FC<Props> = ({ operation, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'negotiations' | 'transport' | 'inspections'>('overview');
  const [negotiations, setNegotiations] = useState<Types.Negotiation[]>([]);
  const [inspections, setInspections] = useState<Types.InspectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState<Types.Negotiation | null>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [showReplacementFinder, setShowReplacementFinder] = useState<Types.TradeSeller | null>(null);

  useEffect(() => {
    if (operation) {
      loadNegotiations();
      loadInspections();
      loadProfitData();
    }
  }, [operation]);

  const loadNegotiations = async () => {
    if (!operation) return;
    try {
      const data = await negotiationService.getByTradeOperation(operation.id);
      setNegotiations(data);
    } catch (error) {
      console.error('Failed to load negotiations:', error);
    }
  };

  const loadInspections = async () => {
    if (!operation) return;
    try {
      const data = await inspectionService.getByTradeOperation(operation.id);
      setInspections(data);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    }
  };

  const loadProfitData = async () => {
    if (!operation) return;
    try {
      const data = await profitService.calculate(operation.id);
      setProfitData(data);
    } catch (error) {
      console.error('Failed to load profit data:', error);
    }
  };

  const loadData = async () => {
    await Promise.all([
      loadNegotiations(),
      loadInspections(),
      loadProfitData(),
      onUpdate()
    ]);
  };

  const handlePhaseChange = async (newPhase: Types.TradePhase) => {
    if (!operation) return;
    
    setLoading(true);
    try {
      await tradeOperationService.updatePhase(operation.id, newPhase);
      onUpdate();
    } catch (error) {
      console.error('Failed to update phase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffers = async (offers: Types.CreateNegotiationDto[]) => {
    if (!operation) return;
    
    setLoading(true);
    try {
      await negotiationService.bulkCreate(operation.id, offers);
      loadNegotiations();
      setShowOfferModal(false);
    } catch (error) {
      console.error('Failed to send offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToNegotiation = async (negotiationId: string, response: Types.RespondToNegotiationDto) => {
    setLoading(true);
    try {
      await negotiationService.respond(negotiationId, response);
      loadNegotiations();
      setShowCounterModal(null);
    } catch (error) {
      console.error('Failed to respond to negotiation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInspections = async () => {
    if (!operation) return;
    
    const unverifiedSellers = operation.sellers?.filter(s => 
      s.status === 'ACCEPTED' && !s.isVerified
    ) || [];
    
    if (unverifiedSellers.length === 0) {
      alert('No unverified sellers to inspect');
      return;
    }
    
    setLoading(true);
    try {
      const saleListingIds = unverifiedSellers.map(s => s.saleListingId);
      await inspectionService.requestForTrade(operation.id, saleListingIds, 'MEDIUM');
      loadInspections();
      onUpdate();
    } catch (error) {
      console.error('Failed to request inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: Types.TradePhase) => {
    switch (phase) {
      case Types.TradePhase.INITIATION: return 'bg-gray-100 text-gray-800';
      case Types.TradePhase.SELLER_NEGOTIATION: return 'bg-blue-100 text-blue-800';
      case Types.TradePhase.TRANSPORT_MATCHING: return 'bg-orange-100 text-orange-800';
      case Types.TradePhase.IN_TRANSIT: return 'bg-purple-100 text-purple-800';
      case Types.TradePhase.DELIVERY: return 'bg-indigo-100 text-indigo-800';
      case Types.TradePhase.PAYMENT: return 'bg-yellow-100 text-yellow-800';
      case Types.TradePhase.COMPLETED: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNegotiationStatusColor = (status: Types.NegotiationStatus) => {
    switch (status) {
      case Types.NegotiationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case Types.NegotiationStatus.ACCEPTED: return 'bg-green-100 text-green-800';
      case Types.NegotiationStatus.REJECTED: return 'bg-red-100 text-red-800';
      case Types.NegotiationStatus.COUNTERED: return 'bg-blue-100 text-blue-800';
      case Types.NegotiationStatus.EXPIRED: return 'bg-gray-100 text-gray-800';
      case Types.NegotiationStatus.WITHDRAWN: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!operation) return null;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">{operation.sellers?.length || 0}</span>
          </div>
          <p className="text-sm text-gray-600">Total Sellers</p>
          <p className="text-xs text-green-600 mt-1">
            {operation.sellers?.filter(s => s.isVerified).length || 0} verified
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">{negotiations.length}</span>
          </div>
          <p className="text-sm text-gray-600">Negotiations</p>
          <p className="text-xs text-blue-600 mt-1">
            {negotiations.filter(n => n.status === Types.NegotiationStatus.PENDING).length} pending
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">
              €{profitData?.estimatedProfit?.toFixed(0) || operation.estimatedProfit?.toFixed(0) || '0'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Est. Profit</p>
          <p className="text-xs text-green-600 mt-1">
            {profitData?.profitMargin?.toFixed(1) || operation.profitMargin?.toFixed(1) || '0'}% margin
          </p>
        </div>
      </div>

      {/* Phase Progression */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4">Phase Progression</h3>
        <div className="flex items-center justify-between mb-4">
          {Object.values(Types.TradePhase).map((phase, index) => (
            <div key={phase} className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                phase === operation.phase ? getPhaseColor(phase) : 
                Object.values(Types.TradePhase).indexOf(phase) < Object.values(Types.TradePhase).indexOf(operation.phase) 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {phase.replace(/_/g, ' ')}
              </div>
              {index < Object.values(Types.TradePhase).length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              )}
            </div>
          ))}
        </div>
        
        {operation.phase !== Types.TradePhase.COMPLETED && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const phases = Object.values(Types.TradePhase);
                const currentIndex = phases.indexOf(operation.phase);
                if (currentIndex < phases.length - 1) {
                  handlePhaseChange(phases[currentIndex + 1]);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Move to Next Phase
            </button>
          </div>
        )}
      </div>

      {/* Buy Listing Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4">Buy Listing Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-semibold">{operation.buyListing?.product?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Buyer</p>
            <p className="font-semibold">{operation.buyListing?.buyer?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Quantity</p>
            <p className="font-semibold">{operation.buyListing?.quantity} {operation.buyListing?.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Price</p>
            <p className="font-semibold">€{operation.buyListing?.maxPricePerUnit}/unit</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSellers = () => {
    // Check for failed inspections
    const failedSellers = operation.sellers?.filter(s => s.status === 'FAILED_INSPECTION') || [];
    const hasFailedInspections = failedSellers.length > 0;
    
    return (
      <div className="space-y-4">
        {/* Warning banner for failed inspections */}
        {hasFailedInspections && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Inspection Failures Detected</p>
                  <p className="text-sm text-red-700">
                    {failedSellers.length} seller(s) failed quality inspection and need replacement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReplacementFinder(failedSellers[0])}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Find Replacement
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Sellers ({operation.sellers?.length || 0})</h3>
          <button
            onClick={() => setShowOfferModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Bulk Offers
          </button>
        </div>

        {operation.sellers?.map((seller) => (
          <div key={seller.id} className={`bg-white p-4 rounded-lg border ${
            seller.status === 'FAILED_INSPECTION'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{seller.seller?.name}</h4>
                <p className="text-sm text-gray-600">
                  {seller.requestedQuantity} {seller.unit} • Status: {seller.status}
                </p>
                {seller.finalPrice && (
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Agreed Price: €{seller.finalPrice}/unit
                  </p>
                )}
                {seller.status === 'FAILED_INSPECTION' && (
                  <p className="text-sm text-red-600 mt-1 font-semibold">
                    ⚠️ Failed quality inspection - replacement needed
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
              {seller.isVerified && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                seller.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                seller.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {seller.status}
              </span>
              </div>
            </div>
          </div>
      ))}

        {(!operation.sellers || operation.sellers.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No sellers added yet
          </div>
        )}
      </div>
    );
  };

  const renderNegotiations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Negotiations ({negotiations.length})</h3>
        <button
          onClick={loadNegotiations}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {negotiations.map((negotiation) => (
        <div key={negotiation.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">
                  {negotiation.tradeSeller?.seller?.name || 'Unknown Seller'}
                </h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNegotiationStatusColor(negotiation.status)}`}>
                  {negotiation.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Offered Price</p>
                  <p className="font-semibold">€{negotiation.offeredPrice}/unit</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold">{negotiation.offeredQuantity} units</p>
                </div>
                {negotiation.expiresAt && (
                  <div>
                    <p className="text-gray-600">Expires</p>
                    <p className="font-semibold">{format(new Date(negotiation.expiresAt), 'MMM dd, HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {negotiation.status === Types.NegotiationStatus.COUNTERED && (
              <button
                onClick={() => setShowCounterModal(negotiation)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Respond
              </button>
            )}
          </div>
        </div>
      ))}

      {negotiations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No negotiations yet
        </div>
      )}
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Inspections ({inspections.length})</h3>
        <button
          onClick={handleRequestInspections}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Request Inspections
        </button>
      </div>

      {inspections.map((inspection) => (
        <div key={inspection.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{inspection.saleListing?.seller?.name}</h4>
              <p className="text-sm text-gray-600">
                Priority: {inspection.priority} • Status: {inspection.status}
              </p>
              {inspection.qualityScore !== undefined && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  Quality Score: {inspection.qualityScore}%
                </p>
              )}
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              inspection.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              inspection.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              inspection.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {inspection.status}
            </span>
          </div>
        </div>
      ))}

      {inspections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No inspections requested yet
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{operation.operationNumber}</h2>
            <p className="text-sm text-gray-600">
              Created {format(new Date(operation.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['overview', 'sellers', 'negotiations', 'transport', 'inspections'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'sellers' && renderSellers()}
          {activeTab === 'negotiations' && renderNegotiations()}
          {activeTab === 'transport' && <TransportManagement tradeOperation={operation} onUpdate={loadData} />}
          {activeTab === 'inspections' && renderInspections()}
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <BulkOfferModal
          sellers={operation.sellers || []}
          onSubmit={handleSendOffers}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {/* Counter Modal */}
      {showCounterModal && (
        <CounterOfferModal
          negotiation={showCounterModal}
          onSubmit={(response) => handleRespondToNegotiation(showCounterModal.id, response)}
          onClose={() => setShowCounterModal(null)}
        />
      )}
      
      {/* Replacement Seller Finder Modal - Disabled (not part of Phase 1) */}
      {/* {showReplacementFinder && (
        <ReplacementSellerFinder
          tradeOperation={operation}
          failedSeller={showReplacementFinder}
          requiredQuantity={showReplacementFinder.requestedQuantity || showReplacementFinder.agreedQuantity || 0}
          onSellerAdded={() => {
            loadData();
            setShowReplacementFinder(null);
          }}
          onClose={() => setShowReplacementFinder(null)}
        />
      )} */}
    </div>
  );
};

// Bulk Offer Modal Component
const BulkOfferModal: React.FC<{
  sellers: any[];
  onSubmit: (offers: Types.CreateNegotiationDto[]) => void;
  onClose: () => void;
}> = ({ sellers, onSubmit, onClose }) => {
  const [offers, setOffers] = useState<Map<string, Types.CreateNegotiationDto>>(new Map());

  const handleSubmit = () => {
    const offerArray = Array.from(offers.values());
    if (offerArray.length > 0) {
      onSubmit(offerArray);
    }
  };

  const updateOffer = (sellerId: string, price: number, quantity: number) => {
    const newOffers = new Map(offers);
    newOffers.set(sellerId, {
      tradeSellerId: sellerId,
      offeredPrice: price,
      offeredQuantity: quantity,
      expiresInHours: 48,
    });
    setOffers(newOffers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Send Bulk Offers</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sellers.filter(s => s.status === 'INVITED').map((seller) => (
            <div key={seller.id} className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">{seller.seller?.name}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Price per unit (€)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    onChange={(e) => updateOffer(seller.id, Number(e.target.value), seller.requestedQuantity)}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Quantity</label>
                  <input
                    type="number"
                    defaultValue={seller.requestedQuantity}
                    onChange={(e) => {
                      const offer = offers.get(seller.id);
                      updateOffer(seller.id, offer?.offeredPrice || 0, Number(e.target.value));
                    }}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send {offers.size} Offers
          </button>
        </div>
      </div>
    </div>
  );
};

// Counter Offer Modal Component
const CounterOfferModal: React.FC<{
  negotiation: Types.Negotiation;
  onSubmit: (response: Types.RespondToNegotiationDto) => void;
  onClose: () => void;
}> = ({ negotiation, onSubmit, onClose }) => {
  const [response, setResponse] = useState<'ACCEPTED' | 'REJECTED' | 'COUNTERED'>('ACCEPTED');
  const [counterPrice, setCounterPrice] = useState(negotiation.offeredPrice);
  const [counterQuantity, setCounterQuantity] = useState(negotiation.offeredQuantity);

  const handleSubmit = () => {
    if (response === 'COUNTERED') {
      onSubmit({
        status: response,
        counterPrice,
        counterQuantity,
      });
    } else {
      onSubmit({ status: response });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Respond to Counter Offer</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Seller's Offer:</p>
          <p className="font-semibold">€{negotiation.offeredPrice}/unit × {negotiation.offeredQuantity} units</p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="ACCEPTED"
              checked={response === 'ACCEPTED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Accept Offer</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="REJECTED"
              checked={response === 'REJECTED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Reject Offer</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="COUNTERED"
              checked={response === 'COUNTERED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Counter Offer</span>
          </label>
        </div>

        {response === 'COUNTERED' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Counter Price (€/unit)</label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Counter Quantity</label>
              <input
                type="number"
                value={counterQuantity}
                onChange={(e) => setCounterQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
};