"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { sportsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function SportDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: sportData, isLoading: sportLoading } = useQuery({
    queryKey: ["sport", slug],
    queryFn: () => sportsApi.getBySlug(slug).then((r) => r.data),
    enabled: !!slug,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["sport-matches", slug],
    queryFn: () => sportsApi.getMatches(slug).then((r) => r.data),
    enabled: !!slug,
  });

  const sport = sportData?.data || sportData;
  const matches = matchesData?.data || matchesData || [];

  if (sportLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="card animate-pulse p-8 text-center">
          <div className="text-lg text-[#6b7280]">Loading sport...</div>
        </div>
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-white">Sport not found</h1>
        <Link href="/sports" className="text-cyan-400 hover:text-cyan-300">← Back to sports</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/sports" className="mb-4 inline-block text-sm text-cyan-400 hover:text-cyan-300">← Back to sports</Link>
      <h1 className="mb-6 text-2xl font-bold text-white">{sport.name}</h1>

      <div className="space-y-4">
        {matches.length > 0 ? (
          matches.map((match: any) => (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="card flex items-center justify-between hover:border-cyan-500/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-4">
                  <span className="w-32 text-right font-medium text-white">{match.homeTeam?.name}</span>
                  <span className="text-sm text-[#6b7280]">vs</span>
                  <span className="w-32 font-medium text-white">{match.awayTeam?.name}</span>
                </div>
                <div className="mt-1 text-xs text-[#6b7280]">
                  {match.league?.name} | {formatDate(match.startTime)}
                </div>
              </div>
              <span className={`text-xs font-medium ${match.status === "LIVE" ? "text-green-400" : "text-[#6b7280]"}`}>
                {match.status === "LIVE" ? "● LIVE" : match.status}
              </span>
            </Link>
          ))
        ) : (
          <div className="card text-center text-[#6b7280]">No matches available for {sport.name}</div>
        )}
      </div>
    </div>
  );
}
