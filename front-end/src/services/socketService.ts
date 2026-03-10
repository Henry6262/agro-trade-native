import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/api';
import { useAuthStore } from '@stores/auth.store';

export interface SocketEventPayloads {
  'trade:updated': { tradeOperationId: string; phase: string; status: string };
  'trade:seller-added': { tradeOperationId: string; sellerCount: number; phase: string };
  'inspection:completed': {
    tradeOperationId: string;
    inspectionId: string;
    passed: boolean;
    qualityScore: number;
  };
  'offer:received': {
    tradeOperationId: string;
    negotiationId: string;
    offer: Record<string, unknown>;
  };
}
export type SocketEventName = keyof SocketEventPayloads;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      // Join the user-specific room so emitToUser() events are received
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        this.socket?.emit('join', { userId });
      }
    });

    this.socket.on('disconnect', (_reason) => {});

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Re-attach any previously registered listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  updateAuth(): void {
    const token = useAuthStore.getState().token;
    if (this.socket && token) {
      this.socket.auth = { token };
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
