"use client";

import Link from "next/link";
import { useLiveMatches } from "@/hooks/useSports";

export default function MatchCenterListPage() {
  const { data, isLoading } = useLiveMatches();

  const matches = data?.data || data || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Match Center</h1>
        <div className="card animate-pulse text-center text-gray-500">Loading live matches...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Match Center</h1>

      {matches.length > 0 ? (
        <div className="grid gap-4">
          {matches.map((match: any) => (
            <Link
              key={match.id}
              href={`/match-center/${match.id}`}
              className="card hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">{match.league?.name}</div>
                  <div className="font-bold">{match.homeTeam?.name}</div>
                  <div className="text-sm text-gray-400">vs</div>
                  <div className="font-bold">{match.awayTeam?.name}</div>
                </div>
                <div className="text-center">
                  {match.status === "LIVE" ? (
                    <div className="flex items-center gap-1 text-sm text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      LIVE
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{match.status}</span>
                  )}
                  <div className="mt-1 text-xl font-bold">
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </div>
                </div>
                <div className="ml-4 text-sm text-blue-400">
                  View Center →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center text-gray-500">
          <p>No live matches currently</p>
          <Link href="/matches" className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
            View upcoming matches →
          </Link>
        </div>
      )}
    </div>
  );
}
