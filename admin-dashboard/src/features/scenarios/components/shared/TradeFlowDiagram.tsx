import React, { useCallback, useMemo } from 'react';
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

interface TradeFlowDiagramProps {
  scenarioState: ScenarioState;
  currentPhase: string;
}

export const TradeFlowDiagram: React.FC<TradeFlowDiagramProps> = ({
  scenarioState,
  currentPhase,
}) => {
  // Determine current phase based on state
  const phase = useMemo(() => {
    if (scenarioState.transportJobs.length > 0) return 'TRANSPORT';
    if (scenarioState.inspections.length > 0) return 'INSPECTION';
    if (scenarioState.negotiations.length > 0) return 'NEGOTIATION';
    if (scenarioState.tradeOperations.length > 0) return 'OPERATION_CREATED';
    if (scenarioState.buyListings.length > 0) return 'BUY_LISTING';
    if (scenarioState.saleListings.length > 0) return 'SALE_LISTINGS';
    if (scenarioState.createdUsers.farmers.length > 0 || scenarioState.createdUsers.buyers.length > 0)
      return 'USERS';
    return 'START';
  }, [scenarioState]);

  // Create nodes based on scenario state
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    let yOffset = 0;

    // User Creation Nodes
    if (scenarioState.createdUsers.farmers.length > 0) {
      scenarioState.createdUsers.farmers.forEach((farmer, idx) => {
        nodes.push({
          id: `farmer-${farmer.id}`,
          type: 'default',
          position: { x: 50, y: yOffset + idx * 80 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold text-green-700">👨‍🌾 {farmer.name}</div>
                <div className="text-gray-500">Farmer</div>
              </div>
            ),
          },
          style: {
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
      yOffset += scenarioState.createdUsers.farmers.length * 80;
    }

    if (scenarioState.createdUsers.buyers.length > 0) {
      scenarioState.createdUsers.buyers.forEach((buyer, idx) => {
        nodes.push({
          id: `buyer-${buyer.id}`,
          type: 'default',
          position: { x: 50, y: yOffset + idx * 80 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold text-blue-700">🏢 {buyer.name}</div>
                <div className="text-gray-500">Buyer</div>
              </div>
            ),
          },
          style: {
            background: '#eff6ff',
            border: '2px solid #93c5fd',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
      yOffset += scenarioState.createdUsers.buyers.length * 80;
    }

    if (scenarioState.createdUsers.transporters.length > 0) {
      scenarioState.createdUsers.transporters.forEach((transporter, idx) => {
        nodes.push({
          id: `transporter-${transporter.id}`,
          type: 'default',
          position: { x: 50, y: yOffset + idx * 80 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold text-orange-700">🚚 {transporter.name}</div>
                <div className="text-gray-500">Transporter</div>
              </div>
            ),
          },
          style: {
            background: '#fff7ed',
            border: '2px solid #fdba74',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
      yOffset += scenarioState.createdUsers.transporters.length * 80;
    }

    if (scenarioState.createdUsers.inspector) {
      nodes.push({
        id: `inspector-${scenarioState.createdUsers.inspector.id}`,
        type: 'default',
        position: { x: 50, y: yOffset },
        data: {
          label: (
            <div className="text-xs">
              <div className="font-bold text-pink-700">
                🔍 {scenarioState.createdUsers.inspector.name}
              </div>
              <div className="text-gray-500">Inspector</div>
            </div>
          ),
        },
        style: {
          background: '#fdf4ff',
          border: '2px solid #f0abfc',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '150px',
        },
      });
    }

    // Sale Listings Nodes
    if (scenarioState.saleListings.length > 0) {
      scenarioState.saleListings.forEach((listing, idx) => {
        nodes.push({
          id: `sale-listing-${idx}`,
          type: 'default',
          position: { x: 300, y: idx * 80 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold">📦 Sale Listing</div>
                <div className="text-gray-500">Product available</div>
              </div>
            ),
          },
          style: {
            background: '#fefce8',
            border: '2px solid #fde047',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
    }

    // Buy Listings Nodes
    if (scenarioState.buyListings.length > 0) {
      scenarioState.buyListings.forEach((listing, idx) => {
        nodes.push({
          id: `buy-listing-${idx}`,
          type: 'default',
          position: { x: 300, y: 200 + idx * 80 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold">🛒 Buy Listing</div>
                <div className="text-gray-500">Request created</div>
              </div>
            ),
          },
          style: {
            background: '#eff6ff',
            border: '2px solid #60a5fa',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
    }

    // Trade Operations Nodes
    if (scenarioState.tradeOperations.length > 0) {
      scenarioState.tradeOperations.forEach((operation, idx) => {
        nodes.push({
          id: `trade-operation-${idx}`,
          type: 'default',
          position: { x: 550, y: 100 + idx * 100 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold text-purple-700">⚡ Trade Operation</div>
                <div className="text-gray-500">Active negotiation</div>
              </div>
            ),
          },
          style: {
            background: '#faf5ff',
            border: '3px solid #c084fc',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '170px',
          },
        });
      });
    }

    // Inspection Nodes
    if (scenarioState.inspections.length > 0) {
      scenarioState.inspections.forEach((inspection, idx) => {
        nodes.push({
          id: `inspection-${idx}`,
          type: 'default',
          position: { x: 800, y: 50 + idx * 70 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold">🔬 Inspection</div>
                <div className="text-gray-500">Quality check</div>
              </div>
            ),
          },
          style: {
            background: '#fdf4ff',
            border: '2px solid #e879f9',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '140px',
          },
        });
      });
    }

    // Transport Jobs Nodes
    if (scenarioState.transportJobs.length > 0) {
      scenarioState.transportJobs.forEach((job, idx) => {
        nodes.push({
          id: `transport-job-${idx}`,
          type: 'default',
          position: { x: 1050, y: 100 + idx * 100 },
          data: {
            label: (
              <div className="text-xs">
                <div className="font-bold">🚛 Transport</div>
                <div className="text-gray-500">In delivery</div>
              </div>
            ),
          },
          style: {
            background: '#fff7ed',
            border: '2px solid #fb923c',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '140px',
          },
        });
      });
    }

    // Phase Indicator Node
    nodes.push({
      id: 'phase-indicator',
      type: 'default',
      position: { x: 600, y: -100 },
      data: {
        label: (
          <div className="text-sm">
            <div className="font-bold text-gray-700">Current Phase</div>
            <div className="text-purple-600 text-lg">{phase}</div>
          </div>
        ),
      },
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '15px',
        minWidth: '200px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
    });

    return nodes;
  }, [scenarioState, phase]);

  // Create edges based on relationships
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    // Connect farmers to sale listings
    scenarioState.saleListings.forEach((listing, idx) => {
      if (idx < scenarioState.createdUsers.farmers.length) {
        const farmer = scenarioState.createdUsers.farmers[idx];
        edges.push({
          id: `farmer-${farmer.id}-to-sale-${idx}`,
          source: `farmer-${farmer.id}`,
          target: `sale-listing-${idx}`,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#86efac', strokeWidth: 2 },
        });
      }
    });

    // Connect buyers to buy listings
    scenarioState.buyListings.forEach((listing, idx) => {
      if (idx < scenarioState.createdUsers.buyers.length) {
        const buyer = scenarioState.createdUsers.buyers[idx];
        edges.push({
          id: `buyer-${buyer.id}-to-buy-${idx}`,
          source: `buyer-${buyer.id}`,
          target: `buy-listing-${idx}`,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#93c5fd', strokeWidth: 2 },
        });
      }
    });

    // Connect buy listings to trade operations
    scenarioState.tradeOperations.forEach((operation, idx) => {
      if (idx < scenarioState.buyListings.length) {
        edges.push({
          id: `buy-listing-${idx}-to-operation-${idx}`,
          source: `buy-listing-${idx}`,
          target: `trade-operation-${idx}`,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#c084fc', strokeWidth: 3 },
        });
      }
    });

    // Connect trade operations to inspections
    scenarioState.inspections.forEach((inspection, idx) => {
      if (idx < scenarioState.tradeOperations.length) {
        edges.push({
          id: `operation-${0}-to-inspection-${idx}`,
          source: `trade-operation-0`,
          target: `inspection-${idx}`,
          type: 'smoothstep',
          animated: phase === 'INSPECTION',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#e879f9', strokeWidth: 2 },
        });
      }
    });

    // Connect trade operations to transport
    scenarioState.transportJobs.forEach((job, idx) => {
      if (idx < scenarioState.tradeOperations.length) {
        edges.push({
          id: `operation-${idx}-to-transport-${idx}`,
          source: `trade-operation-${idx}`,
          target: `transport-job-${idx}`,
          type: 'smoothstep',
          animated: phase === 'TRANSPORT',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#fb923c', strokeWidth: 2 },
        });
      }
    });

    return edges;
  }, [scenarioState, phase]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when scenario state changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Trade Flow Visualization</h2>
      <div style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f3f4f6" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.id.includes('farmer')) return '#86efac';
              if (node.id.includes('buyer')) return '#93c5fd';
              if (node.id.includes('transporter')) return '#fdba74';
              if (node.id.includes('inspector')) return '#f0abfc';
              if (node.id.includes('operation')) return '#c084fc';
              return '#e5e7eb';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
