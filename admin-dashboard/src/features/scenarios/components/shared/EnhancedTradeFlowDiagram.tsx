import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface ScenarioState {
  createdUsers: {
    farmers: any[];
    buyers: any[];
    transporters: any[];
    inspector: any | null;
  };
  saleListings: any[];
  buyListings: any[];
  tradeOperations: any[];
  negotiations: any[];
  inspections: any[];
  transportRequests: any[];
  transportBids: any[];
  transportJobs: any[];
}

interface EnhancedTradeFlowDiagramProps {
  scenarioState: ScenarioState;
  currentPhase: string;
}

// Custom node component for better visualization
const BusinessNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 ${data.className || ''}`}>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon as React.ReactNode}</span>
        <div>
          <div className="font-semibold text-sm">{data.label as React.ReactNode}</div>
          {data.sublabel && (
            <div className="text-xs text-gray-600">{data.sublabel as React.ReactNode}</div>
          )}
          {data.value && (
            <div className="text-xs font-mono mt-1 text-blue-600">{data.value as React.ReactNode}</div>
          )}
        </div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs px-2 py-0.5 rounded-full text-center ${data.statusClass || ''}`}>
          {data.status as React.ReactNode}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  business: BusinessNode,
};

export const EnhancedTradeFlowDiagram: React.FC<EnhancedTradeFlowDiagramProps> = ({
  scenarioState,
  currentPhase,
}) => {
  // Determine current active phase
  const activePhase = useMemo(() => {
    if (scenarioState.transportJobs.length > 0) return 'DELIVERY';
    if (scenarioState.inspections.length > 0) return 'INSPECTION';
    if (scenarioState.negotiations.length > 0) return 'NEGOTIATION';
    if (scenarioState.tradeOperations.length > 0) return 'COORDINATION';
    if (scenarioState.buyListings.length > 0 || scenarioState.saleListings.length > 0) return 'MARKETPLACE';
    if (scenarioState.createdUsers.farmers.length > 0 || scenarioState.createdUsers.buyers.length > 0) return 'ONBOARDING';
    return 'INITIALIZATION';
  }, [scenarioState]);

  // Generate nodes with business context
  const nodes: Node[] = useMemo(() => {
    const nodeList: Node[] = [];
    let yPosition = 50;
    const xSpacing = 250;

    // Column 1: Users
    const userX = 50;

    // Farmers
    scenarioState.createdUsers.farmers.forEach((farmer, idx) => {
      nodeList.push({
        id: `farmer-${farmer.id || idx}`,
        type: 'business',
        position: { x: userX, y: yPosition + idx * 100 },
        data: {
          icon: '👨‍🌾',
          label: farmer.companyName || farmer.name,
          sublabel: 'Supplier',
          value: farmer.location ? '📍 Local Farm' : null,
          className: 'bg-green-50 border-green-400',
          status: farmer.verified ? 'Verified' : 'Pending',
          statusClass: farmer.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
        },
      });
    });

    // Buyers
    const buyerY = yPosition + scenarioState.createdUsers.farmers.length * 100 + 50;
    scenarioState.createdUsers.buyers.forEach((buyer, idx) => {
      nodeList.push({
        id: `buyer-${buyer.id || idx}`,
        type: 'business',
        position: { x: userX, y: buyerY + idx * 100 },
        data: {
          icon: '🏢',
          label: buyer.companyName || buyer.name,
          sublabel: 'Purchaser',
          className: 'bg-blue-50 border-blue-400',
          status: 'Active',
          statusClass: 'bg-blue-100 text-blue-700',
        },
      });
    });

    // Column 2: Listings
    const listingX = userX + xSpacing;

    // Sale Listings
    scenarioState.saleListings.forEach((listing, idx) => {
      const farmer = scenarioState.createdUsers.farmers[idx];
      nodeList.push({
        id: `sale-${idx}`,
        type: 'business',
        position: { x: listingX, y: yPosition + idx * 100 },
        data: {
          icon: '📦',
          label: `${listing.quantity || 0} tons available`,
          sublabel: listing.productType || 'Corn',
          value: `€${listing.pricePerTon || listing.pricePerUnit || 0}/ton`,
          className: 'bg-yellow-50 border-yellow-400',
          status: 'Listed',
          statusClass: 'bg-yellow-100 text-yellow-700',
        },
      });
    });

    // Buy Listings
    scenarioState.buyListings.forEach((listing, idx) => {
      nodeList.push({
        id: `buy-${idx}`,
        type: 'business',
        position: { x: listingX, y: buyerY },
        data: {
          icon: '🛒',
          label: `Need ${listing.quantity || 100} tons`,
          sublabel: listing.productType || 'Corn',
          value: `Max €${listing.maxPricePerTon || listing.maxPricePerUnit || 200}/ton`,
          className: 'bg-blue-50 border-blue-400',
          status: 'Sourcing',
          statusClass: 'bg-blue-100 text-blue-700',
        },
      });
    });

    // Column 3: Trade Operations
    const operationX = listingX + xSpacing;

    scenarioState.tradeOperations.forEach((operation, idx) => {
      const totalSecured = scenarioState.negotiations.filter(n => n.status === 'accepted').length;
      const progress = totalSecured > 0 ? (totalSecured / 3) * 100 : 0;

      nodeList.push({
        id: `operation-${idx}`,
        type: 'business',
        position: { x: operationX, y: yPosition + 150 },
        data: {
          icon: '⚡',
          label: 'Trade Coordination',
          sublabel: `${Math.round(progress)}% Secured`,
          value: scenarioState.negotiations.length > 0 ? `${scenarioState.negotiations.length} Active Deals` : null,
          className: 'bg-purple-50 border-purple-500 border-3',
          status: progress === 100 ? 'Ready for Inspection' : 'Negotiating',
          statusClass: progress === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700',
        },
      });
    });

    // Column 4: Quality & Logistics
    const qualityX = operationX + xSpacing;

    // Inspections
    if (scenarioState.inspections.length > 0) {
      const passedCount = scenarioState.inspections.filter(i => i.passed || i.result === 'PASSED').length;
      nodeList.push({
        id: 'inspection',
        type: 'business',
        position: { x: qualityX, y: yPosition + 100 },
        data: {
          icon: '🔬',
          label: 'Quality Control',
          sublabel: `${passedCount}/${scenarioState.inspections.length} Passed`,
          className: 'bg-pink-50 border-pink-400',
          status: passedCount === scenarioState.inspections.length ? 'All Passed' : 'In Progress',
          statusClass: passedCount === scenarioState.inspections.length ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
        },
      });
    }

    // Transport
    if (scenarioState.transportRequests.length > 0 || scenarioState.transportJobs.length > 0) {
      const isDelivered = scenarioState.transportJobs.some(j => j.status === 'delivered');
      nodeList.push({
        id: 'transport',
        type: 'business',
        position: { x: qualityX, y: yPosition + 200 },
        data: {
          icon: '🚚',
          label: 'Logistics',
          sublabel: isDelivered ? 'Delivered' : 'In Transit',
          value: scenarioState.transportBids.length > 0 ? `${scenarioState.transportBids.length} Bids` : null,
          className: 'bg-orange-50 border-orange-400',
          status: isDelivered ? 'Complete' : 'Active',
          statusClass: isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
        },
      });
    }

    // Column 5: Completion
    const completionX = qualityX + xSpacing;

    if (activePhase === 'DELIVERY' || scenarioState.transportJobs.some(j => j.status === 'delivered')) {
      nodeList.push({
        id: 'completion',
        type: 'business',
        position: { x: completionX, y: yPosition + 150 },
        data: {
          icon: '🎉',
          label: 'Trade Complete',
          sublabel: '100 tons delivered',
          value: '€18,000 Total',
          className: 'bg-gradient-to-r from-green-50 to-blue-50 border-green-500',
          status: 'Success',
          statusClass: 'bg-green-100 text-green-700',
        },
      });
    }

    // Add Phase Indicator
    nodeList.push({
      id: 'phase-indicator',
      type: 'default',
      position: { x: operationX - 100, y: -50 },
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
      data: {
        label: `📊 Phase: ${activePhase}`,
      },
      selectable: false,
      draggable: false,
    });

    return nodeList;
  }, [scenarioState, activePhase]);

  // Generate edges with animation based on phase
  const edges: Edge[] = useMemo(() => {
    const edgeList: Edge[] = [];

    // Connect farmers to their listings
    scenarioState.saleListings.forEach((_, idx) => {
      if (idx < scenarioState.createdUsers.farmers.length) {
        const farmer = scenarioState.createdUsers.farmers[idx];
        edgeList.push({
          id: `farmer-${idx}-to-sale-${idx}`,
          source: `farmer-${farmer.id || idx}`,
          target: `sale-${idx}`,
          type: 'smoothstep',
          animated: activePhase === 'MARKETPLACE',
          style: { stroke: '#86efac', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#86efac' },
        });
      }
    });

    // Connect buyers to buy listings
    scenarioState.buyListings.forEach((_, idx) => {
      if (idx < scenarioState.createdUsers.buyers.length) {
        const buyer = scenarioState.createdUsers.buyers[idx];
        edgeList.push({
          id: `buyer-${idx}-to-buy-${idx}`,
          source: `buyer-${buyer.id || idx}`,
          target: `buy-${idx}`,
          type: 'smoothstep',
          animated: activePhase === 'MARKETPLACE',
          style: { stroke: '#93c5fd', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#93c5fd' },
        });
      }
    });

    // Connect listings to trade operations
    if (scenarioState.tradeOperations.length > 0) {
      // Sale listings to operation
      scenarioState.saleListings.forEach((_, idx) => {
        edgeList.push({
          id: `sale-${idx}-to-operation`,
          source: `sale-${idx}`,
          target: 'operation-0',
          type: 'smoothstep',
          animated: activePhase === 'NEGOTIATION',
          style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5 5' },
        });
      });

      // Buy listing to operation
      scenarioState.buyListings.forEach((_, idx) => {
        edgeList.push({
          id: `buy-${idx}-to-operation`,
          source: `buy-${idx}`,
          target: 'operation-0',
          type: 'smoothstep',
          animated: activePhase === 'COORDINATION',
          style: { stroke: '#60a5fa', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
        });
      });
    }

    // Operation to inspection
    if (scenarioState.inspections.length > 0 && scenarioState.tradeOperations.length > 0) {
      edgeList.push({
        id: 'operation-to-inspection',
        source: 'operation-0',
        target: 'inspection',
        type: 'smoothstep',
        animated: activePhase === 'INSPECTION',
        style: { stroke: '#e879f9', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#e879f9' },
      });
    }

    // Operation to transport
    if (scenarioState.transportRequests.length > 0 && scenarioState.tradeOperations.length > 0) {
      edgeList.push({
        id: 'operation-to-transport',
        source: 'operation-0',
        target: 'transport',
        type: 'smoothstep',
        animated: activePhase === 'DELIVERY',
        style: { stroke: '#fb923c', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c' },
      });
    }

    // Final connections to completion
    if (scenarioState.transportJobs.some(j => j.status === 'delivered')) {
      if (scenarioState.inspections.length > 0) {
        edgeList.push({
          id: 'inspection-to-completion',
          source: 'inspection',
          target: 'completion',
          type: 'smoothstep',
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      }

      edgeList.push({
        id: 'transport-to-completion',
        source: 'transport',
        target: 'completion',
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      });
    }

    return edgeList;
  }, [scenarioState, activePhase]);

  const [nodes_, setNodes, onNodesChange] = useNodesState(nodes);
  const [edges_, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when state changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes_}
        edges={edges_}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
      >
        <Background color="#f3f4f6" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.id.includes('farmer')) return '#86efac';
            if (node.id.includes('buyer')) return '#93c5fd';
            if (node.id.includes('operation')) return '#c084fc';
            if (node.id.includes('transport')) return '#fdba74';
            if (node.id.includes('inspection')) return '#f0abfc';
            if (node.id.includes('completion')) return '#10b981';
            return '#e5e7eb';
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};