"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getChampionIconUrl } from "@/lib/riotAssets";
import { cn } from "@/lib/utils";

export function ChampionAvatar({ name, className }: { name: string; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const iconUrl = getChampionIconUrl(name);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  useEffect(() => {
    setImageFailed(false);
  }, [iconUrl]);

  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-white/[0.12] bg-gradient-to-br from-frost/25 via-arcane/20 to-ember/25 text-lg font-black text-white shadow-card",
        className
      )}
      aria-label={`${name} champion icon`}
    >
      {imageFailed ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.1),transparent)]" />
          <span className="relative">{initials}</span>
        </>
      ) : (
        <Image
          src={iconUrl}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
