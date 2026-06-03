import { cn } from "@/lib/utils";

export function MayhemLogo({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("group/logo inline-flex items-center gap-3", className)}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-frost/[0.38] bg-abyss shadow-glow">
        <span className="absolute inset-0 rounded-md bg-[radial-gradient(circle_at_32%_20%,rgba(66,214,255,0.3),transparent_34%),radial-gradient(circle_at_70%_72%,rgba(184,255,75,0.22),transparent_34%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-9 w-9 transition duration-300 group-hover/logo:scale-105"
          role="img"
          aria-label="MayhemGG logo mark"
        >
          <defs>
            <linearGradient id="mayhem-mark" x1="9" y1="8" x2="55" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#42D6FF" />
              <stop offset="0.58" stopColor="#B8FF4B" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
            <filter id="mayhem-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M32 4 55 14v18c0 14-8.4 22.8-23 28C17.4 54.8 9 46 9 32V14L32 4Z"
            fill="#08111D"
            stroke="url(#mayhem-mark)"
            strokeWidth="3"
          />
          <path
            d="M17 45V20h8l7 11 7-11h8v25h-8V33l-7 10-7-10v12h-8Z"
            fill="none"
            stroke="url(#mayhem-mark)"
            strokeLinejoin="round"
            strokeWidth="5"
            filter="url(#mayhem-glow)"
          />
          <path d="M17 17h12l3 5 3-5h12" fill="none" stroke="#B8FF4B" strokeLinecap="round" strokeWidth="2" opacity="0.72" />
        </svg>
      </span>

      {!compact ? (
        <span className="leading-none">
          <span className="block text-xl font-black tracking-wide text-white">
            Mayhem<span className="text-frost">GG</span>
          </span>
          <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.26em] text-volt">
            ARAM Mayhem / Arena
          </span>
        </span>
      ) : null}
    </span>
  );
}
