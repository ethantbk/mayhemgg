import Link from "next/link";
import { Flame } from "lucide-react";
import { MayhemLogo } from "@/components/MayhemLogo";

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
        <Link href="/" className="flex items-center" aria-label="MayhemGG home">
          <MayhemLogo />
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
