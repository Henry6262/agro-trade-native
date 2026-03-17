import { io, Socket } from "socket.io-client";

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "https://agro-trade-native-production.up.railway.app";

export interface SocketEventPayloads {
  "trade:updated": { tradeOperationId: string; phase: string; status: string };
  "trade:seller-added": {
    tradeOperationId: string;
    sellerCount: number;
    phase: string;
  };
  "inspection:completed": {
    tradeOperationId: string;
    inspectionId: string;
    passed: boolean;
    qualityScore: number;
  };
  "offer:received": {
    tradeOperationId: string;
    negotiationId: string;
    offer: Record<string, unknown>;
  };
}

export type SocketEventName = keyof SocketEventPayloads;

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  connect(token: string, userId: string): void {
    if (this.socket?.connected) return;
    if (!token) return;

    this.socket = io(WS_URL, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on("connect", () => {
      this.socket?.emit("join", { userId });
    });

    this.socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    // Re-attach previously registered listeners
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

  on<K extends SocketEventName>(
    event: K,
    callback: (payload: SocketEventPayloads[K]) => void
  ): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off<K extends SocketEventName>(
    event: K,
    callback: (payload: SocketEventPayloads[K]) => void
  ): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
