"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { memo } from "react";

interface GameCardProps {
  game: {
    id: string;
    name: string;
    slug: string;
    image?: string;
    rtp?: number;
    minBet?: number;
    maxBet?: number;
    provider?: { name: string; logo?: string };
    category?: { name: string; icon?: string };
    featured?: boolean;
    popular?: boolean;
  };
}

const gameImages: Record<string, string> = {
  "gates-of-olympus": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=533&fit=crop",
  "sweet-bonanza": "https://images.unsplash.com/photo-1601740425528-2e2e66f87e3f?w=400&h=533&fit=crop",
  "wolf-gold": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=533&fit=crop",
  "sugar-rush": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=533&fit=crop",
  "starburst": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=533&fit=crop",
  "live-roulette": "https://images.unsplash.com/photo-1518495973-1bac2b7b3a2f?w=400&h=533&fit=crop",
  "live-blackjack": "https://images.unsplash.com/photo-1583779428907-00e4f3ea1415?w=400&h=533&fit=crop",
  "crazy-time": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=533&fit=crop",
  "european-roulette": "https://images.unsplash.com/photo-1603111512458-390a75fad4f6?w=400&h=533&fit=crop",
  "aviator": "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=533&fit=crop",
  "mega-moolah": "https://images.unsplash.com/photo-1596838132731-3301c3fd4315?w=400&h=533&fit=crop",
  "book-of-dead": "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400&h=533&fit=crop",
};

function GameCardInner({ game }: GameCardProps) {
  const imgSrc = game.image || gameImages[game.slug] || "https://images.unsplash.com/photo-1518495973-1bac2b7b3a2f?w=400&h=533&fit=crop";

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Link
        href={`/casino/game/${game.slug}`}
        className="group relative overflow-hidden rounded-xl bg-[#111827]/80 border border-slate-700/30 transition-all duration-300 hover:border-[#00D4FF]/40 hover:shadow-lg hover:shadow-[#00D4FF]/10 block"
      >
        {/* Image container - 3:4 ratio for premium casino feel */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={imgSrc}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {game.featured && (
              <span className="rounded-full bg-[#00D4FF] px-2 py-0.5 text-[10px] font-bold text-black shadow-lg">
                FEATURED
              </span>
            )}
            {game.popular && (
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg">
                HOT
              </span>
            )}
          </div>

          {game.provider && (
            <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm border border-slate-600/30">
              {game.provider.name}
            </div>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
            <span className="rounded-xl bg-[#00D4FF] px-6 py-2.5 text-sm font-bold text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-[#00D4FF]/30">
              Play Now
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#00D4FF] transition-colors">
            {game.name}
          </h3>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{game.category?.icon} {game.category?.name}</span>
            {game.rtp && <span className="text-green-400">{game.rtp}% RTP</span>}
          </div>
          <div className="mt-2 text-[10px] text-slate-600">
            {game.minBet !== undefined && game.maxBet !== undefined
              ? `$${Number(game.minBet).toFixed(2)} - $${Number(game.maxBet).toFixed(2)}`
              : ""}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export const GameCard = memo(GameCardInner);
