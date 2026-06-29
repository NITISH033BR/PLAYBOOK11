"use client";

import Link from "next/link";

interface PromotionCardProps {
  title: string;
  description: string;
  cta?: string;
  ctaLink?: string;
  badge?: string;
  image?: string;
}

export function PromotionCard({ title, description, cta = "Claim Now", ctaLink = "/matches", badge, image }: PromotionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-[#2a3c48] p-6">
      {image && (
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        </div>
      )}
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-[#00e701] px-2.5 py-0.5 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-[#8a9bb0] max-w-md">{description}</p>
        <Link
          href={ctaLink}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#00e701] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#00e701]/90 transition-all active:scale-[0.97]"
        >
          {cta}
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
