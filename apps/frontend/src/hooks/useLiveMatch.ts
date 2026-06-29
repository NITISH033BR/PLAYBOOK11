"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

interface LiveMatchUpdate {
  id: string;
  status: string;
  homeTeam: { id: string; name: string; shortName: string | null; logo: string | null };
  awayTeam: { id: string; name: string; shortName: string | null; logo: string | null };
  league: { id: string; name: string; country: string | null };
  homeScore: number | null;
  awayScore: number | null;
  homeWickets: number | null;
  awayWickets: number | null;
  homeOvers: number | null;
  awayOvers: number | null;
  innings: number | null;
  battingTeam: string | null;
  bowlingTeam: string | null;
  currentRr: number | null;
  requiredRr: number | null;
  lastWicket: Record<string, any> | null;
  currentOver: Record<string, any> | null;
  batsmen: Record<string, any> | null;
  bowler: Record<string, any> | null;
  partnership: Record<string, any> | null;
  commentary: any[] | null;
  events: any[] | null;
  markets: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    odds: Array<{
      id: string;
      label: string;
      type: string;
      value: number;
      liquidity: number;
      active: boolean;
    }>;
  }>;
}

export function useLiveMatch(matchId: string | null) {
  const [data, setData] = useState<LiveMatchUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    const socket: Socket = io(`${WS_URL}/live`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinMatch", matchId);
    });

    socket.on("matchUpdate", (update: LiveMatchUpdate) => {
      setData(update);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setConnected(false);
    });

    return () => {
      socket.emit("leaveMatch", matchId);
      socket.disconnect();
    };
  }, [matchId]);

  return { data, connected };
}
