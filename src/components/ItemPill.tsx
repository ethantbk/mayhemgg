"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Item } from "@/types";
import { getItemIconUrl } from "@/lib/riotAssets";

export function ItemPill({ item }: { item: Item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const iconUrl = getItemIconUrl(item);

  useEffect(() => {
    setImageFailed(false);
  }, [iconUrl]);

  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-2 text-xs font-bold text-slate-200">
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-abyss text-[10px] font-black text-slate-400">
        {iconUrl && !imageFailed ? (
          <Image
            src={iconUrl}
            alt=""
            fill
            sizes="28px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          item.name.slice(0, 2).toUpperCase()
        )}
      </span>
      <span>{item.name}</span>
    </span>
  );
}
