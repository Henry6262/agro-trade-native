import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import {
  MapPin,
  Weight,
  CheckCircle,
  X,
  Target,
  MessageSquare,
  Route,
  Gavel,
  Send,
  Plus,
  TrendingUp,
  ChevronDown,
  Truck,
  Zap,
} from 'lucide-react-native';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

interface TradeFlowModalProps {
  visible: boolean;
  activeTradeFlow: any;
  transporters: any[];
  onClose: () => void;
}

export const TradeFlowModal: React.FC<TradeFlowModalProps> = ({
  visible,
  activeTradeFlow,
  transporters,
  onClose,
}) => {
  const [tradeFlowStage, setTradeFlowStage] = useState<string>('matching');
  const [counterOffers, setCounterOffers] = useState<any[]>([]);
  const [customOfferValues, setCustomOfferValues] = useState({ buyer: '', seller: '' });
  const [offerStatuses, setOfferStatuses] = useState<any>({});
  const [transportBids, setTransportBids] = useState<any[]>([]);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [matchedTransporter, setMatchedTransporter] = useState<any>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const navigateToStage = (stage: string) => {
    setTradeFlowStage(stage);
  };

  const resetTradeFlow = () => {
    setTradeFlowStage('matching');
    setCounterOffers([]);
    setTransportBids([]);
    setRouteCalculated(false);
    setShowOfferDetails(false);
    onClose();
  };

  const sendCounterOffer = (party: string, newPrice: string) => {
    const offer = {
      id: `OFFER-${Date.now()}`,
      party,
      price: newPrice,
      timestamp: new Date().toISOString(),
      status: 'pending',
      sentBy: 'platform',
    };
    setCounterOffers([...counterOffers, offer]);
    setOfferStatuses({ ...offerStatuses, [offer.id]: 'pending' });
    setTradeFlowStage('negotiating');
  };

  const acceptTerms = () => {
    setTradeFlowStage('transport-search');
    setTimeout(() => {
      setTradeFlowStage('bidding');
    }, 2000);
  };

  const completeTrade = (winningBid?: any) => {
    const transporter = winningBid?.transporter || matchedTransporter;
    if (transporter) {
      setMatchedTransporter(transporter);
      setTradeFlowStage('completed');
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'matching':
        return <Target size={16} color="#FFFFFF" />;
      case 'negotiating':
        return <MessageSquare size={16} color="#FFFFFF" />;
      case 'transport-search':
        return <Route size={16} color="#FFFFFF" />;
      case 'bidding':
        return <Gavel size={16} color="#FFFFFF" />;
      case 'completed':
        return <CheckCircle size={16} color="#FFFFFF" />;
      default:
        return <Target size={16} color="#FFFFFF" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'matching':
        return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
      case 'negotiating':
        return { backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#F97316' };
      case 'transport-search':
        return { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#A855F7' };
      case 'bidding':
        return { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FCD34D' };
      case 'completed':
        return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' };
      default:
        return { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#9CA3AF' };
    }
  };

  const stages = ['matching', 'negotiating', 'transport-search', 'bidding', 'completed'];
  const currentStageIndex = stages.indexOf(tradeFlowStage);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <Card style={{
            backgroundColor: 'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            margin: 16,
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {getStageIcon(tradeFlowStage)}
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>
                  ACTIVE TRADE FLOW - {activeTradeFlow.id}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Badge style={getStageColor(tradeFlowStage)}>
              {tradeFlowStage.toUpperCase().replace('-', ' ')}
            </Badge>

            {/* Progress Stages */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 16 }}>
              {stages.map((stage, index) => (
                <TouchableOpacity
                  key={stage}
                  onPress={() => navigateToStage(stage)}
                  style={{ alignItems: 'center', flex: 1 }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: index <= currentStageIndex ? '#22C55E' : '#374151',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {getStageIcon(stage)}
                  </View>
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}>
                    {stage.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Progress Line */}
            <View style={{
              position: 'absolute',
              top: 82,
              left: 32,
              right: 32,
              height: 2,
              backgroundColor: '#374151',
            }}>
              <View style={{
                width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
                height: '100%',
                backgroundColor: '#22C55E',
              }} />
            </View>
          </Card>

          {/* Stage Content */}
          <View style={{ padding: 16 }}>
            {tradeFlowStage === 'matching' && (
              <MatchingStage 
                activeTradeFlow={activeTradeFlow}
                onNavigate={navigateToStage}
              />
            )}

            {tradeFlowStage === 'negotiating' && (
              <NegotiatingStage
                activeTradeFlow={activeTradeFlow}
                routeCalculated={routeCalculated}
                showOfferDetails={showOfferDetails}
                customOfferValues={customOfferValues}
                onRouteCalculate={() => setRouteCalculated(true)}
                onToggleOfferDetails={() => setShowOfferDetails(!showOfferDetails)}
                onCustomOfferChange={setCustomOfferValues}
                onSendCounterOffer={sendCounterOffer}
                onAcceptTerms={acceptTerms}
              />
            )}

            {tradeFlowStage === 'transport-search' && (
              <TransportSearchStage
                transporters={transporters}
                onNavigate={navigateToStage}
                onCancel={resetTradeFlow}
              />
            )}

            {tradeFlowStage === 'bidding' && (
              <BiddingStage
                transportBids={transportBids}
                onCompleteTrade={completeTrade}
                onCancel={resetTradeFlow}
              />
            )}

            {tradeFlowStage === 'completed' && (
              <CompletedStage
                matchedTransporter={matchedTransporter}
                onReset={resetTradeFlow}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Stage Components
const MatchingStage = ({ activeTradeFlow, onNavigate }: any) => (
  <View style={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 8 }}>
        <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>BUYER MATCH</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{activeTradeFlow.buyOrder.product}</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{activeTradeFlow.buyOrder.buyer}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
            {activeTradeFlow.buyOrder.flag} {activeTradeFlow.buyOrder.location}
          </Text>
        </View>
        <Text style={{ color: '#22C55E', fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>
          Max: {activeTradeFlow.buyOrder.maxPrice}/ton
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 8 }}>
        <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>SELLER MATCH</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{activeTradeFlow.sellOrder.product}</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{activeTradeFlow.sellOrder.farmer}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
            {activeTradeFlow.sellOrder.flag} {activeTradeFlow.sellOrder.location}
          </Text>
        </View>
        <Text style={{ color: '#22C55E', fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>
          Min: {activeTradeFlow.sellOrder.minPrice}/ton
        </Text>
      </View>
    </View>

    <View style={{ padding: 16, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>POTENTIAL MARGIN</Text>
        <Text style={{ color: '#22C55E', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>
          {activeTradeFlow.potentialMargin}%
        </Text>
      </View>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
        Price spread: ${(
          parseFloat(activeTradeFlow.buyOrder.maxPrice.replace('$', '')) -
          parseFloat(activeTradeFlow.sellOrder.minPrice.replace('$', ''))
        ).toFixed(0)}/ton
      </Text>
    </View>

    <View style={{ flexDirection: 'row', gap: 12 }}>
      <TouchableOpacity
        onPress={() => onNavigate('negotiating')}
        style={{
          flex: 1,
          backgroundColor: '#F97316',
          padding: 16,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageSquare size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
          Start Negotiation
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onNavigate('transport-search')}
        style={{
          flex: 1,
          backgroundColor: '#22C55E',
          padding: 16,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
          Accept & Find Transport
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const NegotiatingStage = ({ activeTradeFlow, routeCalculated, showOfferDetails, customOfferValues, onRouteCalculate, onToggleOfferDetails, onCustomOfferChange, onSendCounterOffer, onAcceptTerms }: any) => (
  <View style={{ gap: 16 }}>
    {/* Negotiation header */}
    <View style={{ padding: 16, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)', borderRadius: 8 }}>
      <Text style={{ color: '#F97316', fontSize: 14, fontWeight: 'bold' }}>NEGOTIATION PHASE</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Optimizing margins through counter offers</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace' }}>
          Potential Margin: {activeTradeFlow.potentialMargin}%
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Current spread: $20/ton</Text>
      </View>
    </View>

    {/* Offer Management Button */}
    <TouchableOpacity
      onPress={onToggleOfferDetails}
      style={{
        padding: 16,
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>MANAGE OFFERS & NEGOTIATIONS</Text>
      <ChevronDown size={16} color="#9CA3AF" style={{ transform: [{ rotate: showOfferDetails ? '180deg' : '0deg' }] }} />
    </TouchableOpacity>

    {/* Accept Terms Button */}
    <TouchableOpacity
      onPress={onAcceptTerms}
      style={{
        backgroundColor: '#22C55E',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
        Accept Terms & Proceed
      </Text>
    </TouchableOpacity>
  </View>
);

const TransportSearchStage = ({ transporters, onNavigate, onCancel }: any) => (
  <View style={{ gap: 16 }}>
    <View style={{ padding: 16, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>TRANSPORT SEARCH</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Finding suitable transporters for the trade</Text>
    </View>

    <View style={{ padding: 16, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>AVAILABLE TRANSPORTERS</Text>
      {transporters.map((transporter: any) => (
        <View key={transporter.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Truck size={16} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{transporter.company}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Capacity: {transporter.capacity} tons</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Rate: {transporter.rate}/mile</Text>
          </View>
        </View>
      ))}
    </View>

    <View style={{ flexDirection: 'row', gap: 12 }}>
      <TouchableOpacity
        onPress={() => onNavigate('bidding')}
        style={{
          flex: 1,
          backgroundColor: '#FCD34D',
          padding: 16,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Gavel size={16} color="#000000" />
        <Text style={{ color: '#000000', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
          Proceed to Bidding
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: '#EF4444',
          padding: 16,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
          Cancel Trade Flow
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const BiddingStage = ({ transportBids, onCompleteTrade, onCancel }: any) => (
  <View style={{ gap: 16 }}>
    <View style={{ padding: 16, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>BIDDING PHASE</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Transporters are bidding on the trade</Text>
    </View>

    <TouchableOpacity
      onPress={() => onCompleteTrade()}
      style={{
        backgroundColor: '#22C55E',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CheckCircle size={16} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
        Accept Winning Bid
      </Text>
    </TouchableOpacity>
  </View>
);

const CompletedStage = ({ matchedTransporter, onReset }: any) => (
  <View style={{ gap: 16 }}>
    <View style={{ padding: 16, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>TRADE COMPLETED</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>The trade has been successfully completed</Text>
    </View>

    <TouchableOpacity
      onPress={onReset}
      style={{
        backgroundColor: '#22C55E',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Plus size={16} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
        Start New Trade Flow
      </Text>
    </TouchableOpacity>
  </View>
);