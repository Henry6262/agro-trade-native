import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emit(event: string, data: unknown) {
    if (!this.server) return;
    this.server.emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
