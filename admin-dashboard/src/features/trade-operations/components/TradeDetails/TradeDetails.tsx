import React, { useState, useEffect } from 'react';
import * as Types from '../../../../types';
import {
  tradeOperationService,
  negotiationService,
  inspectionService,
  profitService
} from '../../../../services/api';
import { TransportManagement } from '../../../transport/components/TransportManagement/TransportManagement';
import { OverviewTab, SellersTab, NegotiationsTab, InspectionsTab } from './tabs';
import { BulkOfferModal, CounterOfferModal } from './modals';
import { X } from 'lucide-react';
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
      case Types.NegotiationStatus.EXPIRED: return 'bg-red-100 text-red-800';
      case Types.NegotiationStatus.WITHDRAWN: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!operation) return null;

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
          {activeTab === 'overview' && (
            <OverviewTab
              operation={operation}
              negotiations={negotiations}
              inspections={inspections}
              transport={operation.transport}
              profitData={profitData}
              loading={loading}
              onPhaseChange={handlePhaseChange}
              getPhaseColor={getPhaseColor}
            />
          )}
          {activeTab === 'sellers' && (
            <SellersTab
              operation={operation}
              onSendBulkOffers={() => setShowOfferModal(true)}
              onFindReplacement={(seller) => setShowReplacementFinder(seller)}
            />
          )}
          {activeTab === 'negotiations' && (
            <NegotiationsTab
              negotiations={negotiations}
              onRefresh={loadNegotiations}
              onRespond={(negotiation) => setShowCounterModal(negotiation)}
              getNegotiationStatusColor={getNegotiationStatusColor}
            />
          )}
          {activeTab === 'transport' && (
            <TransportManagement tradeOperation={operation} onUpdate={loadData} />
          )}
          {activeTab === 'inspections' && (
            <InspectionsTab
              inspections={inspections}
              loading={loading}
              onRequestInspections={handleRequestInspections}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showOfferModal && (
        <BulkOfferModal
          sellers={operation.sellers || []}
          onSubmit={handleSendOffers}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {showCounterModal && (
        <CounterOfferModal
          negotiation={showCounterModal}
          onSubmit={(response) => handleRespondToNegotiation(showCounterModal.id, response)}
          onClose={() => setShowCounterModal(null)}
        />
      )}
    </div>
  );
};
