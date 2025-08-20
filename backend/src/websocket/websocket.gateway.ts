import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    return 'Hello from WebSocket!';
  }

  // Emit events for real-time updates
  emitOrderUpdate(order: any) {
    this.server.emit('order-update', order);
  }

  emitDealUpdate(deal: any) {
    this.server.emit('deal-update', deal);
  }

  emitBidUpdate(bid: any) {
    this.server.emit('bid-update', bid);
  }
}