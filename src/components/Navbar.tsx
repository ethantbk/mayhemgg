import Link from "next/link";
import { Flame, Swords } from "lucide-react";

const navItems = [
  { href: "/champions", label: "Champions" },
  { href: "/tier-list", label: "Tier List" },
  { href: "/broken-builds", label: "Broken Builds" },
  { href: "/augments", label: "Augments" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-abyss/[0.82] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="MayhemGG home">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-frost/[0.35] bg-frost/10 text-frost shadow-glow">
            <Swords className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-none">
            <span className="block text-lg font-black tracking-wide text-white">MayhemGG</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-volt">Arena Intel</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/broken-builds"
          className="inline-flex items-center gap-2 rounded-md border border-ember/40 bg-ember/10 px-3 py-2 text-sm font-bold text-ember transition hover:bg-ember/[0.18]"
        >
          <Flame className="h-4 w-4" aria-hidden="true" />
          Meta Heat
        </Link>
      </div>
    </header>
  );
}
