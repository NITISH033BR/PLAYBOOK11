import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { LiveService } from "./live.service";

@WebSocketGateway({
  namespace: "/live",
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://playbook11.online"
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LiveGateway.name);
  private intervals = new Map<string, NodeJS.Timeout>();

  @WebSocketServer() server!: Server;

  constructor(private readonly liveService: LiveService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.rooms.forEach((room) => {
      if (room !== client.id) {
        this.checkRoomEmpty(room);
      }
    });
  }

  @SubscribeMessage("joinMatch")
  handleJoinMatch(client: Socket, matchId: string) {
    const room = `match:${matchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    this.startMatchInterval(matchId);
  }

  @SubscribeMessage("leaveMatch")
  handleLeaveMatch(client: Socket, matchId: string) {
    const room = `match:${matchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left ${room}`);
    this.checkRoomEmpty(room);
  }

  private startMatchInterval(matchId: string) {
    if (this.intervals.has(matchId)) return;

    const room = `match:${matchId}`;
    const interval = setInterval(async () => {
      try {
        const data = await this.liveService.getMatchUpdate(matchId);
        if (data) {
          this.server.to(room).emit("matchUpdate", data);
        }
      } catch (err) {
        this.logger.error(`Error polling match ${matchId}: ${err.message}`);
      }
    }, 2000);

    this.intervals.set(matchId, interval);
  }

  private checkRoomEmpty(room: string) {
    const roomObj = this.server.sockets.adapter.rooms.get(room);
    if (!roomObj || roomObj.size === 0) {
      this.stopMatchInterval(room.replace("match:", ""));
    }
  }

  private stopMatchInterval(matchId: string) {
    const interval = this.intervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(matchId);
    }
  }
}
