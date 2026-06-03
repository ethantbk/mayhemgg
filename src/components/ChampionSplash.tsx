"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getChampionSplashUrl } from "@/lib/riotAssets";

export function ChampionSplash({
  name,
  className
}: {
  name: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const splashUrl = getChampionSplashUrl(name);

  useEffect(() => {
    setImageFailed(false);
  }, [splashUrl]);

  if (imageFailed) {
    return null;
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <Image
        src={splashUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        onError={() => setImageFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/85 to-panel/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-panel/20" />
    </div>
  );
}
