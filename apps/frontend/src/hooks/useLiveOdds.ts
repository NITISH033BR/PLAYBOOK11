"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

interface LiveOddsEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  status: "upcoming" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  bookmakers: Array<{
    key: string;
    title: string;
    lastUpdate: string;
    markets: Array<{
      key: string;
      name: string;
      lastUpdate: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export function useLiveOdds() {
  const [events, setEvents] = useState<LiveOddsEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io(`${WS_URL}/odds`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("oddsUpdate", (data: LiveOddsEvent[]) => {
      if (Array.isArray(data)) {
        setEvents(data);
        setLastUpdate(new Date().toISOString());
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Odds socket connection error:", err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { events, connected, lastUpdate };
}
