"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Augment } from "@/types";
import { getAugmentAssetKey, getAugmentIconPath } from "@/lib/augmentAssets";
import { cn } from "@/lib/utils";

type AugmentIconSource = Pick<Augment, "id" | "name"> | string;

export function AugmentIcon({
  augment,
  className,
  imageClassName
}: {
  augment: AugmentIconSource;
  className?: string;
  imageClassName?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const iconPath = getAugmentIconPath(augment);
  const assetKey = getAugmentAssetKey(augment);
  const gradientId = `augment-fallback-${assetKey}`;
  const label = typeof augment === "string" ? augment : augment.name;

  useEffect(() => {
    setImageFailed(false);
  }, [iconPath]);

  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-frost/[0.32] bg-abyss text-frost shadow-glow",
        className
      )}
      aria-label={`${label} augment icon`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_32%_18%,rgba(66,214,255,0.34),transparent_36%),radial-gradient(circle_at_74%_78%,rgba(184,255,75,0.24),transparent_38%)]" />
      {!imageFailed ? (
        <Image
          src={iconPath}
          alt=""
          fill
          sizes="40px"
          className={cn("object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 40 40" className="relative h-8 w-8" aria-hidden="true">
          <path d="M20 3 34 11v18L20 37 6 29V11L20 3Z" fill="#08111D" stroke={`url(#${gradientId})`} strokeWidth="2" />
          <path d="M12 25 20 9l8 16-8 5-8-5Z" fill="none" stroke="#B8FF4B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
          <path d="M15 24h10M17 20h6" stroke="#42D6FF" strokeLinecap="round" strokeWidth="2" />
          <defs>
            <linearGradient id={gradientId} x1="6" y1="3" x2="34" y2="37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#42D6FF" />
              <stop offset="0.62" stopColor="#B8FF4B" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <span className="sr-only">{assetKey}</span>
    </span>
  );
}
