import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, OnModuleDestroy } from "@nestjs/common";
import { OddsService } from "./odds.service";

@WebSocketGateway({
  namespace: "/odds",
  cors: { origin: "*", credentials: true },
})
export class OddsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(OddsGateway.name);
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly oddsService: OddsService) {}

  private clientCount = 0;

  afterInit() {
    this.broadcastInterval = setInterval(async () => {
      if (this.clientCount === 0) return;
      try {
        const events = await this.oddsService.getAllLiveEvents();
        this.server.emit("oddsUpdate", events);
      } catch (err) {
        this.logger.warn(`Broadcast error: ${(err as Error).message}`);
      }
    }, 15_000);
    this.logger.log("Odds WebSocket initialized");
  }

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.log(`Client connected to /odds: ${client.id} (${this.clientCount} total)`);
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.log(`Client disconnected from /odds: ${client.id} (${this.clientCount} remaining)`);
  }

  onModuleDestroy() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }
}
